// src/api/evaluationClient.js

const API_BASE_URL = '/api/evaluation';

export async function analyzeSolutionSWOT(solutionText) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/swot-analysis`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ solution_text: solutionText })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate SWOT analysis and solution enhancement.');
    }

    return await response.json();
}