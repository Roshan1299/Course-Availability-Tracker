# UAlberta Course Monitor - Tampermonkey Script

## Installation

1. Install the [Tampermonkey browser extension](https://www.tampermonkey.net/)
2. Click on this link to install the script: [Install UAlberta Course Monitor](https://raw.githubusercontent.com/your-repo/course-monitor/master/tampermonkey/course-monitor.user.js)
3. Click "Install" when prompted by Tampermonkey
4. The script will now run automatically on BearTracks pages

## Usage

1. Navigate to your course registration page on BearTracks
2. You'll see a monitoring panel appear in the top-right corner
3. The script will automatically check for course availability every 5 minutes
4. When a course becomes available, you'll receive:
   - Desktop notification
   - Email notification (if server is configured)
   - Visual alert in the monitoring panel

## Features

- **Automatic monitoring**: Checks course availability every 5 minutes
- **Email notifications**: Sends email alerts when courses become available
- **Visual panel**: Real-time monitoring status in top-right corner
- **Alert history**: Keeps track of recent availability alerts
- **Server integration**: Connects to course monitoring backend
- **Rate limiting**: Prevents spam by limiting alert frequency

## Server Configuration

The script is pre-configured to connect to a monitoring server. You can customize these settings in the script if needed:

- Server URL: `https://52.15.146.9:3443/alert`
- Authentication: Basic auth with predefined credentials
- Timeout: 15 seconds

## Troubleshooting

- If you don't see the monitoring panel, check that Tampermonkey is enabled
- Make sure you're on the correct BearTracks domain
- Check browser console for any error messages
- Ensure your browser allows notifications if you want desktop alerts

## Test Features

The monitoring panel includes three test buttons:
- **Test Alert**: Sends a test email to verify server connectivity
- **Test Server**: Tests server connection only
- **Clear History**: Clears the alert history