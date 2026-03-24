import React from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SecurityIcon from '@mui/icons-material/Security';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        pt: { xs: 10, md: 15 },
        pb: 10,
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '3px solid #e62429',
      }}
    >
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(230, 36, 41, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(230, 36, 41, 0.05) 0%, transparent 50%)`,
        }}
      />
      
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box>
              <Typography 
                variant="h1" 
                sx={{ 
                  mb: 2,
                  fontFamily: 'Bebas Neue',
                  fontSize: { xs: '3rem', md: '4.5rem' },
                  background: 'linear-gradient(45deg, #e62429 30%, #ff6b6b 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                }}
              >
                VULNERASHIELD
              </Typography>
              
              <Typography 
                variant="h2" 
                sx={{ 
                  mb: 3,
                  fontFamily: 'Bebas Neue',
                  fontSize: { xs: '2rem', md: '3rem' },
                  color: '#fff',
                  letterSpacing: '2px',
                }}
              >
                YOUR MEDIA'S <span style={{ color: '#e62429' }}>SUPERHERO</span>
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  color: '#ccc',
                  maxWidth: '600px',
                  lineHeight: 1.6,
                }}
              >
                Detect and redact vulnerabilities in images, videos, and audio files.
                Protect sensitive information with AI-powered tools.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<UploadFileIcon />}
                  onClick={() => navigate('/upload')}
                  sx={{
                    background: 'linear-gradient(45deg, #e62429 30%, #ff1744 90%)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontFamily: 'Bebas Neue',
                    letterSpacing: '1.5px',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #ff1744 30%, #e62429 90%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 20px rgba(230, 36, 41, 0.3)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  UPLOAD MEDIA
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<SecurityIcon />}
                  onClick={() => navigate('/workspace')}
                  sx={{
                    borderColor: '#e62429',
                    color: '#e62429',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontFamily: 'Bebas Neue',
                    letterSpacing: '1.5px',
                    '&:hover': {
                      borderColor: '#ff1744',
                      backgroundColor: 'rgba(230, 36, 41, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  WORKSPACE
                </Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box 
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: '300px', md: '400px' },
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                borderRadius: '20px',
                border: '3px solid #e62429',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(230, 36, 41, 0.2)',
              }}
            >
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    linear-gradient(90deg, transparent 49%, #e62429 50%, transparent 51%),
                    linear-gradient(transparent 49%, #e62429 50%, transparent 51%),
                    radial-gradient(circle at center, transparent 30%, #e62429 31%, transparent 32%),
                    radial-gradient(circle at center, transparent 60%, #e62429 61%, transparent 62%)
                  `,
                  backgroundSize: '50px 50px, 50px 50px, 100% 100%, 100% 100%',
                  opacity: 0.3,
                  animation: 'spin 20s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              
              <Box 
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: 2,
                }}
              >
                <SecurityIcon sx={{ fontSize: '80px', color: '#e62429', mb: 2 }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: 'Bebas Neue',
                    color: '#fff',
                    letterSpacing: '2px',
                  }}
                >
                  MEDIA PROTECTION
                </Typography>
                <Typography sx={{ color: '#ccc', mt: 1 }}>
                  Image • Video • Audio
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;