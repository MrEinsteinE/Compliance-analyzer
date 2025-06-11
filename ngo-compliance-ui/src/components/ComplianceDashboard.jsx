import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button, Paper, Tabs, Tab, Avatar } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { 
    MdCheckCircle, 
    MdWarning, 
    MdError, 
    MdHelpOutline, 
    MdReplay, 
    MdCalendarToday, 
    MdAssessment, 
    MdGavel, 
    MdCorporateFare 
} from 'react-icons/md';

// --- MOCK DATA for the calendar (other data comes from the result prop) ---
const mockCalendarData = {
    deadlines: [
        { date: "2025-07-31", event: "Annual Return Filing (FCRA)" },
        { date: "2025-09-30", event: "Income Tax Return Filing" },
        { date: "2025-12-15", event: "Advance Tax Payment" },
    ]
};

const COLORS = { 'Compliant': '#2e7d32', 'Partial': '#ed6c02', 'Non-compliant': '#d32f2f', 'Not Addressed': '#616161' };

const getStatusChip = (status) => {
    // ... (This function remains the same as before) ...
    const statusLower = status ? status.toLowerCase() : '';
    if (statusLower.includes('compliant')) return <Chip icon={<MdCheckCircle />} label={status} color="success" size="small" variant="outlined" />;
    if (statusLower.includes('partial')) return <Chip icon={<MdWarning />} label={status} color="warning" size="small" variant="outlined" />;
    if (statusLower.includes('non-compliant')) return <Chip icon={<MdError />} label={status} color="error" size="small" variant="outlined" />;
    return <Chip icon={<MdHelpOutline />} label={status || 'Not Addressed'} color="default" size="small" variant="outlined" />;
};

const ComplianceDashboard = ({ result, onReset }) => {
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event, newValue) => setTabIndex(newValue);
    
    // Calculate data for the pie chart
    const statusCounts = result.compliance_breakdown.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {});
    const pieChartData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status],
    }));

    return (
        <Paper elevation={0} sx={{ p: { xs: 1, md: 3 }, backgroundColor: 'transparent' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', borderBottom: '1px solid #ddd', pb: 2 }}>
                <Typography variant="h4" sx={{ mb: { xs: 2, md: 0 } }}>Compliance Analysis Report</Typography>
                <Button variant="outlined" startIcon={<MdReplay />} onClick={onReset}>
                    Analyze Another
                </Button>
            </Box>

            <Tabs value={tabIndex} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth" sx={{ mb: 3 }}>
                <Tab icon={<MdAssessment />} label="Overall Summary" />
                <Tab icon={<MdGavel />} label="Clause Details" />
                <Tab icon={<MdCalendarToday />} label="Compliance Calendar" />
            </Tabs>

            {/* --- Tab 1: Overall Summary --- */}
            {tabIndex === 0 && (
                <Box>
                    <Grid container spacing={4}>
                        <Grid item xs={12} lg={7}>
                            <Card sx={{ height: '100%', boxShadow: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h5" gutterBottom>Executive Summary</Typography>
                                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>{result.executive_summary}</Typography>
                                    
                                    {/* --- THIS BOX NOW USES REAL DATA FROM THE RESULT PROP --- */}
                                    <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}><MdCorporateFare size={32} /></Avatar>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Selected NGO Type</Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {result.identified_ngo_type}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        {/* ... (The Pie Chart Grid item remains the same) ... */}
                        <Grid item xs={12} lg={5}>
                           <Card sx={{ height: '100%', boxShadow: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h5" gutterBottom align="center">Compliance Status Breakdown</Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} innerRadius={60} outerRadius={100} fill="#8884d8" dataKey="value" paddingAngle={5}>
                                                {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}
            
            {/* ... (The other tabs for Clause Details and Calendar remain the same) ... */}
            {tabIndex === 1 && (
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                    {result.compliance_breakdown.map((item) => (
                        <Card key={item.clause_id} variant="outlined" sx={{ boxShadow: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary">{item.clause_id}</Typography>
                                    {getStatusChip(item.status)}
                                </Box>
                                <Typography variant="h6" component="p" sx={{ mb: 2 }}>{item.clause_text}</Typography>
                                {item.evidence_in_policy && ( <Box sx={{ p: 2, backgroundColor: '#e8f5e9', borderRadius: 1, mb: 2, borderLeft: `4px solid ${COLORS.Compliant}` }}><Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Evidence Found in Policy:</Typography><Typography variant="body2" sx={{ fontStyle: 'italic', color: '#1b5e20' }}>"{item.evidence_in_policy}"</Typography></Box> )}
                                <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, borderLeft: '4px solid #1976d2' }}><Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>AI Recommendation:</Typography><Typography variant="body2">{item.recommendation}</Typography></Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {tabIndex === 2 && (
                <Box sx={{ mt: 3 }}>
                     <Card sx={{ boxShadow: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>Upcoming Compliance Deadlines</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>Based on your NGO type and jurisdiction, here are key upcoming dates.</Typography>
                            <Grid container spacing={3}>
                                {mockCalendarData.deadlines.map((deadline, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{new Date(deadline.date).toLocaleDateString('en-US', { day: '2-digit' })}</Typography>
                                            <Typography variant="h6">{new Date(deadline.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Typography>
                                            <Typography variant="body1" sx={{ mt: 1.5, flexGrow: 1 }}>{deadline.event}</Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </Paper>
    );
};

export default ComplianceDashboard;