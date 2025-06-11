import React, { useState } from 'react';
import { Button, Box, Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { MdUploadFile } from 'react-icons/md';

// We don't need axios or the API_URL for this rock-solid demo.

const UploadForm = ({ onAnalysisStart, onAnalysisSuccess, onAnalysisError }) => {
  const [file, setFile] = useState(null);
  const [country, setCountry] = useState('IN'); // Default country

  const handleFileChange = (event) => setFile(event.target.files[0]);
  const handleCountryChange = (event) => setCountry(event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      onAnalysisError('Please select a file to upload.');
      return;
    }
    onAnalysisStart();

    // --- DYNAMIC MOCK DEMO LOGIC ---
    // This dynamically imports the correct JSON file based on the selected country.
    try {
      let mockData;
      console.log(`Loading mock data for country: ${country}`);

      switch (country) {
        case 'US':
          mockData = (await import('../mock-analysis-US.json')).default;
          break;
        case 'EU':
          mockData = (await import('../mock-analysis-EU.json')).default;
          break;
        case 'IN':
        default:
          mockData = (await import('../mock-analysis-IN.json')).default;
          break;
      }
      
      // Simulate a realistic analysis time for the demo
      setTimeout(() => {
        onAnalysisSuccess(mockData);
      }, 2000); 

    } catch (err) {
        console.error("Failed to load mock data:", err);
        onAnalysisError("Could not load the analysis data for the selected region.");
    }
    // --- END DYNAMIC MOCK DEMO LOGIC ---
  };

  return (
    <Card sx={{ minWidth: 275, maxWidth: 600, boxShadow: 3 }}>
        <CardContent>
            <Typography variant="h5" component="div" gutterBottom>Start Your Compliance Check</Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="country-select-label">Select Country/Region for Analysis</InputLabel>
                    <Select
                        labelId="country-select-label"
                        id="country-select"
                        value={country}
                        label="Select Country/Region for Analysis"
                        onChange={handleCountryChange}
                    >
                        <MenuItem value="IN">India</MenuItem>
                        <MenuItem value="US">United States</MenuItem>
                        <MenuItem value="EU">European Union</MenuItem>
                        {/* Add more as you create more mock files */}
                    </Select>
                </FormControl>
                <Button variant="outlined" component="label" fullWidth startIcon={<MdUploadFile />} sx={{ mb: 2, p: 2 }}>
                    {file ? file.name : 'Choose Policy File(s) (.zip, .pdf, .docx, .txt)'}
                    <input type="file" hidden onChange={handleFileChange} />
                </Button>
                <Button type="submit" fullWidth variant="contained" disabled={!file} sx={{ p: 1.5, fontWeight: 'bold' }}>
                    Analyze Now
                </Button>
            </Box>
        </CardContent>
    </Card>
  );
};

export default UploadForm;