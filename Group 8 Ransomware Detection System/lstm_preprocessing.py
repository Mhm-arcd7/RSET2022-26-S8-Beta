# =====================================================
# LSTM PREPROCESSING ONLY
# =====================================================

import pandas as pd
import numpy as np

print("\n🚀 Starting LSTM preprocessing...")

# =====================================================
# CONFIG
# =====================================================
ATA_RAW_PATH = "revilata.csv"
MEM_RAW_PATH = "revilmem.csv"

OUTPUT_PREPROCESSED = "lstm_preprocessed.csv"

WINDOW_NS = 100_000_000  # 100 ms

# =====================================================
# LOAD RAW FILES
# =====================================================
ATA_COLUMNS = [
    "time_s", "time_ns", "lba", "size", "entropy", "ignore"
]

MEM_COLUMNS = [
    "time_s", "time_ns", "gpa", "size", "entropy", "ignore"
]

ata = pd.read_csv(ATA_RAW_PATH, header=None, names=ATA_COLUMNS, low_memory=False)
mem = pd.read_csv(MEM_RAW_PATH, header=None, names=MEM_COLUMNS, low_memory=False)

print("ATA rows:", len(ata))
print("MEM rows:", len(mem))

# =====================================================
# CLEAN DATA
# =====================================================
ata = ata.drop(columns=["ignore"], errors="ignore")
mem = mem.drop(columns=["ignore"], errors="ignore")

for col in ["time_s", "time_ns", "size", "entropy"]:
    ata[col] = pd.to_numeric(ata[col], errors="coerce")
    mem[col] = pd.to_numeric(mem[col], errors="coerce")

ata["lba"] = pd.to_numeric(ata["lba"], errors="coerce")
mem["gpa"] = pd.to_numeric(mem["gpa"], errors="coerce")

ata = ata.dropna()
mem = mem.dropna()

# =====================================================
# NORMALIZE COLUMN NAMES
# =====================================================
ata.columns = ata.columns.str.upper()
mem.columns = mem.columns.str.upper()

ata["SOURCE"] = "disk"
mem["SOURCE"] = "mem"

# =====================================================
# MERGE EVENTS
# =====================================================
merged = pd.concat([ata, mem], ignore_index=True)

merged["TIMESTAMP"] = merged["TIME_S"] * 1e9 + merged["TIME_NS"]
merged["T_REL"] = merged["TIMESTAMP"] - merged["TIMESTAMP"].min()

merged = merged.sort_values("T_REL").reset_index(drop=True)

print("✅ Events merged:", len(merged))

# =====================================================
# WINDOWING
# =====================================================
merged["WINDOW_ID"] = (merged["T_REL"] // WINDOW_NS).astype(int)

# =====================================================
# MEMORY FEATURES
# =====================================================
mem_df = merged[merged["SOURCE"] == "mem"]

mem_features = mem_df.groupby("WINDOW_ID").agg(
    mem_write_count=("SOURCE", "count"),
    mem_avg_entropy=("ENTROPY", "mean"),
    mem_std_entropy=("ENTROPY", "std"),
    mem_total_bytes=("SIZE", "sum"),
    mem_gpa_variance=("GPA", "var")
).reset_index()

# =====================================================
# DISK FEATURES
# =====================================================
disk_df = merged[merged["SOURCE"] == "disk"]

disk_features = disk_df.groupby("WINDOW_ID").agg(
    disk_write_count=("SOURCE", "count"),
    disk_avg_entropy=("ENTROPY", "mean"),
    disk_total_bytes=("SIZE", "sum"),
    disk_lba_variance=("LBA", "var")
).reset_index()

# =====================================================
# MERGE FEATURES
# =====================================================
windowed_df = pd.merge(
    mem_features,
    disk_features,
    on="WINDOW_ID",
    how="outer"
).fillna(0)

windowed_df["time_sec"] = windowed_df["WINDOW_ID"] * (WINDOW_NS / 1e9)

print("✅ Windowed rows:", len(windowed_df))

# =====================================================
# SAVE PREPROCESSED FILE
# =====================================================
windowed_df.to_csv(OUTPUT_PREPROCESSED, index=False)

print("\n✅ LSTM preprocessing COMPLETE")
print("Saved:", OUTPUT_PREPROCESSED)