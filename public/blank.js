import { recentregister} from './model.js';
async function displayRecentRegistrations() {
    try {
        const colleges = await recentregister();
        const collegeListElement = document.getElementById('collegeList');
        collegeListElement.textContent = JSON.stringify(colleges, null, 2); // Display JSON with indentation
    } catch (error) {
        // Handle errors if needed
        console.log('Error getting recent registrations:', error.message);
    }
}

// Call the function to display recent registrations when the page loads
displayRecentRegistrations();