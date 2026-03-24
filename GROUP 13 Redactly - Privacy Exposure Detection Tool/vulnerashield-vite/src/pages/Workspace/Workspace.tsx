import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Tabs, 
  Tab,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useDropzone } from 'react-dropzone';

const StyledWorkspace = styled(Box)(({ theme }) => ({
  paddingTop: '100px',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)',
}));

const MediaCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(26, 26, 26, 0.8)',
  border: '2px solid #e62429',
  borderRadius: '10px',
  color: '#fff',
  height: '100%',
  backdropFilter: 'blur(10px)',
}));

const ToolButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #e62429 30%, #ff1744 90%)',
  color: 'white',
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  fontFamily: 'Bebas Neue',
  fontSize: '1.1rem',
  letterSpacing: '1px',
  margin: theme.spacing(0.5),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(230, 36, 41, 0.4)',
  },
  transition: 'all 0.3s',
}));

const Workspace = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    onDrop: (acceptedFiles) => {
      setUploadedFiles(acceptedFiles);
      setProcessing(true);
      // Simulate processing
      const interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(interval);
            setProcessing(false);
            return 100;
          }
          return Math.min(oldProgress + 10, 100);
        });
      }, 300);
    }
  });

  const tools = [
    { icon: <BlurOnIcon />, label: 'BLUR', color: '#e62429' },
    { icon: <VolumeOffIcon />, label: 'MUTE', color: '#ff1744' },
    { icon: <ContentCutIcon />, label: 'TRIM', color: '#ff9100' },
    { icon: <TextFieldsIcon />, label: 'REDACT TEXT', color: '#00e676' },
    { icon: <DeleteIcon />, label: 'DELETE SEGMENT', color: '#f50057' },
  ];

  const vulnerabilities = [
    { type: 'Faces', count: 3, severity: 'high' },
    { type: 'License Plates', count: 1, severity: 'high' },
    { type: 'Sensitive Text', count: 5, severity: 'medium' },
    { type: 'GPS Data', count: 2, severity: 'medium' },
    { type: 'Audio Names', count: 2, severity: 'low' },
  ];

  return (
    <StyledWorkspace>
      <Container maxWidth="xl">
        <Typography 
          variant="h2" 
          sx={{ 
            mb: 4, 
            fontFamily: 'Bebas Neue',
            textAlign: 'center',
            color: '#fff',
            letterSpacing: '2px',
          }}
        >
          MEDIA <span style={{ color: '#e62429' }}>WORKSPACE</span>
        </Typography>

        <Grid container spacing={4}>
          {/* Left Panel - Upload & Tools */}
          <Grid item xs={12} md={4}>
            <MediaCard>
              <Typography variant="h5" sx={{ mb: 3, color: '#e62429', fontFamily: 'Bebas Neue' }}>
                UPLOAD MEDIA
              </Typography>
              
              <Box
                {...getRootProps()}
                sx={{
                  border: '3px dashed #e62429',
                  borderRadius: '10px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(230, 36, 41, 0.05)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    backgroundColor: 'rgba(230, 36, 41, 0.1)',
                    borderColor: '#ff1744',
                  },
                }}
              >
                <input {...getInputProps()} />
                <UploadFileIcon sx={{ fontSize: 60, color: '#e62429', mb: 2 }} />
                <Typography sx={{ color: '#fff', mb: 1 }}>
                  Drag & drop files here
                </Typography>
                <Typography sx={{ color: '#ccc', fontSize: '0.9rem' }}>
                  Supports images, videos, and audio files
                </Typography>
              </Box>

              {processing && (
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ color: '#fff', mb: 1 }}>Processing...</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(45deg, #e62429 30%, #ff1744 90%)',
                      }
                    }}
                  />
                </Box>
              )}

              <Typography variant="h5" sx={{ mt: 4, mb: 2, color: '#e62429', fontFamily: 'Bebas Neue' }}>
                REDACTION TOOLS
              </Typography>
              
              <Grid container spacing={1}>
                {tools.map((tool, index) => (
                  <Grid item xs={6} key={index}>
                    <ToolButton
                      fullWidth
                      startIcon={tool.icon}
                      sx={{ background: `linear-gradient(45deg, ${tool.color} 30%, ${tool.color}90 90%)` }}
                    >
                      {tool.label}
                    </ToolButton>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(45deg, #00e676 30%, #00c853 90%)',
                    fontFamily: 'Bebas Neue',
                    fontSize: '1.1rem',
                  }}
                >
                  SAVE
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  sx={{
                    borderColor: '#e62429',
                    color: '#e62429',
                    fontFamily: 'Bebas Neue',
                    fontSize: '1.1rem',
                    '&:hover': {
                      borderColor: '#ff1744',
                    },
                  }}
                >
                  CLEAR
                </Button>
              </Box>
            </MediaCard>
          </Grid>

          {/* Center Panel - Media Preview */}
          <Grid item xs={12} md={5}>
            <MediaCard>
              <Typography variant="h5" sx={{ mb: 3, color: '#e62429', fontFamily: 'Bebas Neue' }}>
                MEDIA PREVIEW
              </Typography>
              
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    color: '#fff',
                    fontFamily: 'Bebas Neue',
                    fontSize: '1.1rem',
                  },
                  '& .Mui-selected': {
                    color: '#e62429',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#e62429',
                  },
                }}
              >
                <Tab label="IMAGE" />
                <Tab label="VIDEO" />
                <Tab label="AUDIO" />
              </Tabs>

              <Box
                sx={{
                  height: '400px',
                  backgroundColor: '#000',
                  borderRadius: '10px',
                  border: '2px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {uploadedFiles.length > 0 ? (
                  <Typography sx={{ color: '#fff' }}>
                    {uploadedFiles[0].name}
                  </Typography>
                ) : (
                  <Typography sx={{ color: '#666', textAlign: 'center' }}>
                    Upload a file to see preview
                    <br />
                    <span style={{ fontSize: '0.8rem' }}>Supported: PNG, JPG, MP4, MP3, etc.</span>
                  </Typography>
                )}

                {/* Vulnerability indicators */}
                <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                  {vulnerabilities.map((vuln, index) => (
                    <Chip
                      key={index}
                      label={`${vuln.type}: ${vuln.count}`}
                      size="small"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        backgroundColor: 
                          vuln.severity === 'high' ? '#e62429' :
                          vuln.severity === 'medium' ? '#ff9100' : '#4caf50',
                        color: '#fff',
                        fontFamily: 'Roboto',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Alert 
                severity="warning" 
                sx={{ 
                  mt: 3,
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  color: '#ffb300',
                  border: '1px solid #ffb300',
                }}
              >
                <strong>5 vulnerabilities detected!</strong> - Use tools above to redact sensitive information.
              </Alert>
            </MediaCard>
          </Grid>

          {/* Right Panel - Vulnerabilities */}
          <Grid item xs={12} md={3}>
            <MediaCard>
              <Typography variant="h5" sx={{ mb: 3, color: '#e62429', fontFamily: 'Bebas Neue' }}>
                DETECTED VULNERABILITIES
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: '#fff', mb: 1 }}>DETECTION ENGINE</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="YOLOv8" sx={{ backgroundColor: '#e62429', color: '#fff' }} />
                  <Chip label="OpenCV" sx={{ backgroundColor: '#ff1744', color: '#fff' }} />
                  <Chip label="Whisper" sx={{ backgroundColor: '#00e676', color: '#fff' }} />
                  <Chip label="Tesseract" sx={{ backgroundColor: '#ff9100', color: '#fff' }} />
                  <Chip label="PyTorch" sx={{ backgroundColor: '#651fff', color: '#fff' }} />
                </Box>
              </Box>

              <Box>
                <Typography sx={{ color: '#fff', mb: 2 }}>VULNERABILITY TYPES:</Typography>
                {vulnerabilities.map((vuln, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1.5,
                      p: 1.5,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '5px',
                      borderLeft: `4px solid ${
                        vuln.severity === 'high' ? '#e62429' :
                        vuln.severity === 'medium' ? '#ff9100' : '#4caf50'
                      }`,
                    }}
                  >
                    <Typography sx={{ color: '#fff' }}>{vuln.type}</Typography>
                    <Chip
                      label={vuln.severity.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: 
                          vuln.severity === 'high' ? '#e62429' :
                          vuln.severity === 'medium' ? '#ff9100' : '#4caf50',
                        color: '#fff',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  background: 'linear-gradient(45deg, #e62429 30%, #ff1744 90%)',
                  fontFamily: 'Bebas Neue',
                  fontSize: '1.2rem',
                  py: 1.5,
                }}
              >
                SCAN AGAIN
              </Button>
            </MediaCard>
          </Grid>
        </Grid>
      </Container>
    </StyledWorkspace>
  );
};

export default Workspace;

export {};