import React, { useState } from 'react';
import axios from 'axios'; // We are using axios again for real
import { Button, Box, Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { MdUploadFile } from 'react-icons/md';

// ========================================================================
// CRITICAL: Paste the REAL API Gateway URL from your `serverless deploy` output
// ========================================================================
const API_URL = 'https://fd6pujaxck.execute-api.us-west-2.amazonaws.com/analyze';

const UploadForm = ({ onAnalysisStart, onAnalysisSuccess, onAnalysisError }) => {
  const [file, setFile] = useState(null);
  const [country, setCountry] = useState('IN');

  const handleFileChange = (event) => setFile(event.target.files[0]);
  const handleCountryChange = (event) => setCountry(event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      onAnalysisError('Please select a file to upload.');
      return;
    }

    onAnalysisStart();

    // This is the REAL file reading and API call logic
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = reader.result.split(',')[1];
        
        const payload = {
          filename: file.name,
          document_base64: base64String,
          country_code: country,
        };

        console.log('Sending payload to API:', payload); // For debugging

        // Make the actual network request to your deployed backend
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Received response from API:', response.data); // For debugging

        // Pass the REAL data from the AI to the dashboard
        onAnalysisSuccess(response.data);

      } catch (err) {
        console.error("API Call Failed:", err);
        if (err.code === 'ERR_NETWORK') {
            onAnalysisError('Network Error: Could not connect to the API. This is likely a CORS issue on the backend. Please check the backend logs in AWS CloudWatch.');
        } else if (err.response) {
            // The request was made and the server responded with a status code that falls out of the range of 2xx
            console.error('Error response data:', err.response.data);
            onAnalysisError(`Analysis failed: ${err.response.data.error || 'The server returned an error.'}`);
        } else {
            onAnalysisError('An unknown error occurred. Check the browser console and backend logs.');
        }
      }
    };
    reader.onerror = (error) => {
      console.error("File Reading Failed:", error);
      onAnalysisError('An error occurred while reading the file.');
    };
  };

  return (
    <Card sx={{ minWidth: 275, maxWidth: 600, boxShadow: 3 }}>
        <CardContent>
            <Typography variant="h5" component="div" gutterBottom>Start Your Compliance Check</Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="country-select-label">Select Country/Region for Analysis</InputLabel>
                    <Select labelId="country-select-label" id="country-select" value={country} label="Select Country/Region for Analysis" onChange={handleCountryChange}>
                        <MenuItem value="IN">India</MenuItem>
                        <MenuItem value="US">United States</MenuItem>
                        <MenuItem value="EU">European Union</MenuItem>
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