import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

import Upload from "./pages/Upload/Upload";
import Analyzing from "./pages/Analyzing/Analyzing";
import Results from "./pages/Results/Results";
import MetadataResultPage from "./pages/MetadataResult/MetadataResult";
import ImageResult from "./pages/ImageResult/ImageResult";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/analyzing" element={<Analyzing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/metadata-result" element={<MetadataResultPage />} />
        <Route path="/image-result" element={<ImageResult />} />
      </Routes>
    </>
  );
}

export default App;
