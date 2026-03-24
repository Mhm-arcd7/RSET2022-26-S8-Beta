import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ShieldIcon from '@mui/icons-material/Shield';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate } from 'react-router-dom';

const StatCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(40,40,40,0.9) 100%)',
  border: '2px solid #333',
  borderRadius: '15px',
  color: '#fff',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-5px)',
    borderColor: '#e62429',
    boxShadow: '0 10px 30px rgba(230, 36, 41, 0.2)',
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  background: 'rgba(20, 20, 20, 0.8)',
  border: '2px solid transparent',
  borderRadius: '15px',
  color: '#fff',
  padding: theme.spacing(3),
  textAlign: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#e62429',
    background: 'rgba(230, 36, 41, 0.05)',
  },
}));

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Images Protected', value: '1,234', icon: <ImageIcon />, color: '#e62429' },
    { label: 'Videos Secured', value: '456', icon: <VideocamIcon />, color: '#ff1744' },
    { label: 'Audio Files', value: '789', icon: <MicIcon />, color: '#ff9100' },
    { label: 'Success Rate', value: '98.7%', icon: <TrendingUpIcon />, color: '#00e676' },
  ];

  const features = [
    {
      title: 'FACE DETECTION',
      description: 'AI-powered face blurring using YOLOv8',
      icon: '👤',
      tech: 'OpenCV • PyTorch',
    },
    {
      title: 'TEXT REDACTION',
      description: 'OCR text detection and redaction',
      icon: '📝',
      tech: 'Tesseract • Regex',
    },
    {
      title: 'AUDIO MUTING',
      description: 'Sensitive audio segment detection',
      icon: '🔊',
      tech: 'Whisper • PyTorch',
    },
    {
      title: 'METADATA SCRUB',
      description: 'EXIF and metadata removal',
      icon: '🏷️',
      tech: 'ExifTool • Python',
    },
  ];

  return (
    <Box sx={{ py: 10, background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)' }}>
      <Container maxWidth="xl">
        <Typography 
          variant="h2" 
          sx={{ 
            mb: 2, 
            textAlign: 'center',
            fontFamily: 'Bebas Neue',
            color: '#fff',
            letterSpacing: '2px',
          }}
        >
          YOUR <span style={{ color: '#e62429' }}>SECURITY</span> DASHBOARD
        </Typography>
        
        <Typography 
          sx={{ 
            textAlign: 'center', 
            color: '#ccc', 
            mb: 6,
            maxWidth: '800px',
            mx: 'auto',
            fontSize: '1.1rem',
          }}
        >
          Real-time monitoring and protection statistics for your media files
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: `${stat.color}20`,
                        borderRadius: '10px',
                        p: 1.5,
                        mr: 2,
                      }}
                    >
                      {React.cloneElement(stat.icon, { 
                        sx: { fontSize: 30, color: stat.color } 
                      })}
                    </Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontFamily: 'Bebas Neue',
                        fontSize: '2.5rem',
                        color: stat.color,
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                  <Typography 
                    sx={{ 
                      color: '#ccc',
                      fontSize: '0.9rem',
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ 
                      mt: 2,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: `${stat.color}30`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: stat.color,
                        borderRadius: 3,
                      }
                    }}
                  />
                </CardContent>
              </StatCard>
            </Grid>
          ))}
        </Grid>

        {/* Features Section */}
        <Typography 
          variant="h3" 
          sx={{ 
            mb: 4, 
            textAlign: 'center',
            fontFamily: 'Bebas Neue',
            color: '#fff',
            letterSpacing: '2px',
          }}
        >
          PROTECTION <span style={{ color: '#e62429' }}>FEATURES</span>
        </Typography>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontSize: '3rem',
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 2,
                    fontFamily: 'Bebas Neue',
                    color: '#e62429',
                    letterSpacing: '1px',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#ccc',
                    mb: 2,
                    fontSize: '0.9rem',
                  }}
                >
                  {feature.description}
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#666',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {feature.tech}
                </Typography>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Box 
          sx={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(230,36,41,0.1) 0%, rgba(230,36,41,0.05) 100%)',
            borderRadius: '20px',
            p: 6,
            border: '2px solid #e62429',
          }}
        >
          <ShieldIcon sx={{ fontSize: 60, color: '#e62429', mb: 3 }} />
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 3,
              fontFamily: 'Bebas Neue',
              color: '#fff',
              letterSpacing: '2px',
            }}
          >
            READY TO SECURE YOUR MEDIA?
          </Typography>
          <Typography 
            sx={{ 
              color: '#ccc', 
              mb: 4,
              maxWidth: '600px',
              mx: 'auto',
              fontSize: '1.1rem',
            }}
          >
            Upload your files and let our AI-powered system detect and redact vulnerabilities automatically.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/upload')}
              sx={{
                background: 'linear-gradient(45deg, #e62429 30%, #ff1744 90%)',
                color: 'white',
                px: 6,
                py: 1.5,
                fontSize: '1.2rem',
                fontFamily: 'Bebas Neue',
                letterSpacing: '1.5px',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 25px rgba(230, 36, 41, 0.4)',
                },
                transition: 'all 0.3s',
              }}
            >
              START PROTECTING
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/history')}
              sx={{
                borderColor: '#e62429',
                color: '#e62429',
                px: 4,
                py: 1.5,
                fontSize: '1.2rem',
                fontFamily: 'Bebas Neue',
                letterSpacing: '1.5px',
                '&:hover': {
                  borderColor: '#ff1744',
                  backgroundColor: 'rgba(230, 36, 41, 0.1)',
                },
              }}
            >
              VIEW HISTORY
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;