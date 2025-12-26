// ==UserScript==
// @name         UAlberta Course Monitor (Quick Fix)
// @namespace    http://tampermonkey.net/
// @version      1.7.2
// @description  Simple course availability monitor - QUICK FIX
// @author       You
// @match        *://register.beartracks.ualberta.ca/*
// @match        *://*.beartracks.ualberta.ca/*
// @include      https://register.beartracks.ualberta.ca/*
// @include      *://register.beartracks.ualberta.ca/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      52.15.146.9
// @connect      52.15.146.9:3443
// @connect      *
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // FORCE CONSOLE OUTPUT TO SHOW SCRIPT IS RUNNING
    console.log('🚨🚨🚨 UALBERTA COURSE MONITOR SCRIPT IS RUNNING! 🚨🚨🚨');
    console.log('Script URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    console.log('Tampermonkey detected:', typeof GM_info !== 'undefined' ? 'YES' : 'NO');
    if (typeof GM_info !== 'undefined') {
        console.log('GM_info:', GM_info);
    }

    // Show immediate visual indicator
    const immediateIndicator = document.createElement('div');
    immediateIndicator.innerHTML = '🔥 SCRIPT LOADED! 🔥';
    immediateIndicator.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        background: red !important;
        color: white !important;
        padding: 10px !important;
        z-index: 999999 !important;
        font-size: 16px !important;
        font-weight: bold !important;
    `;

    // Try to add indicator immediately
    if (document.body) {
        document.body.appendChild(immediateIndicator);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(immediateIndicator);
        });
    }

    // Remove indicator after 3 seconds
    setTimeout(() => {
        if (immediateIndicator.parentNode) {
            immediateIndicator.parentNode.removeChild(immediateIndicator);
        }
    }, 3000);

    const CONFIG = {
        checkInterval: 5 * 60 * 1000, // 5 minutes
        maxLogEntries: 50,
        serverUrl: "https://52.15.146.9:3443/alert",
        authToken: "Basic Y291cnNlYWRtaW46QTFiMkMzZDQh",
        timeout: 15000 // 15 second timeout
    };

    let courseStatuses = JSON.parse(localStorage.getItem('courseStatuses') || '{}');
    let lastCheck = localStorage.getItem('lastCheck') || 'Never';
    let alertHistory = JSON.parse(localStorage.getItem('alertHistory') || '[]');

    function createMonitoringPanel() {
        console.log('Creating monitoring panel...');

        // Remove existing panel if it exists
        const existingPanel = document.getElementById('course-monitor-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'course-monitor-panel';
        panel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            right: 10px !important;
            background: #2c3e50 !important;
            color: white !important;
            padding: 15px !important;
            border-radius: 8px !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            z-index: 99999 !important;
            max-width: 320px !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            border: 2px solid #3498db !important;
        `;

        panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; color: #3498db;">
                🔍 Course Monitor Active
            </div>
            <div id="monitor-status">Initializing...</div>
            <div id="last-check" style="margin-top: 5px; font-size: 10px; color: #bdc3c7;">
                Last check: ${lastCheck}
            </div>
            <div style="margin-top: 10px; font-size: 10px;">
                <div style="font-weight: bold;">Monitoring:</div>
                <div id="courses-being-monitored">Loading...</div>
            </div>
            <div style="margin-top: 10px; font-size: 10px;">
                <div style="font-weight: bold;">Recent Alerts:</div>
                <div id="alert-history" style="max-height: 150px; overflow-y: auto;">
                    ${formatAlertHistory()}
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 9px; color: #95a5a6;">
                <button id="test-alert-btn" style="background: #3498db; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">
                    Test Alert
                </button>
                <button id="clear-history-btn" style="background: #e74c3c; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer; margin-left: 5px;">
                    Clear History
                </button>
                <button id="test-server-btn" style="background: #f39c12; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer; margin-left: 5px;">
                    Test Server
                </button>
            </div>
        `;

        document.body.appendChild(panel);
        console.log('✅ Panel added to document body');

        // Add event listeners for buttons
        document.getElementById('test-alert-btn')?.addEventListener('click', testAlert);
        document.getElementById('clear-history-btn')?.addEventListener('click', clearHistory);
        document.getElementById('test-server-btn')?.addEventListener('click', testServerConnection);

        return panel;
    }

    function testServerConnection() {
        console.log('🔍 Testing server connection...');
        updateMonitorStatus('🔍 Testing server...');

        if (typeof GM_xmlhttpRequest === 'undefined') {
            console.error('❌ GM_xmlhttpRequest not available');
            updateMonitorStatus('❌ GM_xmlhttpRequest not available');
            return;
        }

        // Test with a simple GET request first
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://52.15.146.9:3443/",
            timeout: CONFIG.timeout,
            headers: {
                "Authorization": CONFIG.authToken
            },
            onload: function(response) {
                console.log('✅ Server connection test successful:', response.status, response.responseText);
                updateMonitorStatus('✅ Server connection OK');
            },
            onerror: function(error) {
                console.error('❌ Server connection test failed:', error);
                updateMonitorStatus('❌ Server connection failed');
            },
            ontimeout: function() {
                console.error('⏰ Server connection test timed out');
                updateMonitorStatus('⏰ Server connection timeout');
            }
        });
    }

    function testAlert() {
        console.log('🚨🚨🚨 TESTING EMAIL ALERT SYSTEM 🚨🚨🚨');
        console.log('🧪 This should send you a real email!');
        console.log('🧪 Current server URL:', CONFIG.serverUrl);
        console.log('🧪 Auth token:', CONFIG.authToken);

        const testCourse = {
            code: "TAMPERMONKEY-TEST",
            title: "Email Test from Tampermonkey Script - " + new Date().toLocaleTimeString(),
            isFull: false
        };

        console.log('🧪 Test course data:', JSON.stringify(testCourse, null, 2));

        // Update status to show test is running
        updateMonitorStatus('🧪 SENDING TEST EMAIL... CHECK CONSOLE!');

        // Send the test alert
        logAvailabilityNotification([testCourse]);

        console.log('🧪 Test email request initiated! Watch console for results...');
    }

    function clearHistory() {
        alertHistory = [];
        localStorage.setItem('alertHistory', JSON.stringify(alertHistory));
        updateAlertHistoryUI();
        updateMonitorStatus('🗑️ Alert history cleared');
    }

    function formatAlertHistory() {
        return alertHistory.slice(0, 5).map(alert => `
            <div style="margin: 3px 0; padding: 3px; background: rgba(0,0,0,0.2); border-radius: 3px;">
                <div style="color: #3498db; font-size: 9px;">${alert.time}</div>
                ${alert.courses.map(c => `• ${c.code}: ${c.title.substring(0, 30)}...`).join('<br>')}
                ${alert.emailSent ? '<span style="color: #27ae60;">✓ Email sent</span>' : '<span style="color: #e74c3c;">✗ Email failed</span>'}
            </div>
        `).join('') || '<div style="color: #bdc3c7;">No recent alerts</div>';
    }

    function extractCourseInfo() {
        console.log('🔍 Extracting course information...');
        const courses = [];

        // Try multiple selectors to find course boxes
        const selectors = [
            '.cbox.cbox-unlocked',
            '.cbox',
            '[class*="cbox"]',
            '.course-box',
            '.course-container'
        ];

        let courseBoxes = [];
        for (const selector of selectors) {
            courseBoxes = document.querySelectorAll(selector);
            if (courseBoxes.length > 0) {
                console.log(`✅ Found ${courseBoxes.length} course boxes using selector: ${selector}`);
                break;
            }
        }

        if (courseBoxes.length === 0) {
            console.log('❌ No course boxes found with any selector');
            console.log('Available classes on page:', document.querySelectorAll('[class*="course"], [class*="class"], [class*="box"]'));
            return courses;
        }

        courseBoxes.forEach((box, index) => {
            try {
                // Try multiple ways to extract course code
                const codeSelectors = ['.cbox-cn', '.course-code', '.class-number', '[class*="code"]'];
                let codeElement = null;
                for (const sel of codeSelectors) {
                    codeElement = box.querySelector(sel);
                    if (codeElement) break;
                }

                // Try multiple ways to extract course title
                const titleSelectors = ['.cbox-title', '.course-title', '.class-title', '[class*="title"]'];
                let titleElement = null;
                for (const sel of titleSelectors) {
                    titleElement = box.querySelector(sel);
                    if (titleElement) break;
                }

                // Try to find warning/status elements
                const warningSelectors = ['.cbox-warnings', '.warnings', '.status', '[class*="warning"]', '[class*="full"]'];
                let warningElement = null;
                for (const sel of warningSelectors) {
                    warningElement = box.querySelector(sel);
                    if (warningElement) break;
                }

                if (codeElement && titleElement) {
                    const courseCode = codeElement.textContent.replace(/\s+/g, ' ').trim();
                    const courseTitle = titleElement.textContent.trim();

                    // Check if course is full
                    let isFull = false;
                    if (warningElement) {
                        const warningText = warningElement.textContent.toLowerCase();
                        isFull = warningText.includes('full') || warningText.includes('closed') || warningText.includes('unavailable');
                    }

                    // Also check the entire box text for full indicators
                    const boxText = box.textContent.toLowerCase();
                    if (boxText.includes('all classes are full') || boxText.includes('class is full')) {
                        isFull = true;
                    }

                    courses.push({
                        code: courseCode,
                        title: courseTitle,
                        isFull: isFull,
                        index: index
                    });

                    console.log(`Course ${index}: ${courseCode} - ${courseTitle} (${isFull ? 'FULL' : 'AVAILABLE'})`);
                } else {
                    // Try alternative extraction methods for problematic boxes
                    const allText = box.textContent;
                    const lines = allText.split('\n').filter(line => line.trim());
                    
                    if (lines.length >= 2) {
                        // Try to find course code pattern (e.g., CMPUT302)
                        const codePattern = /([A-Z]+\s*\d+)/;
                        const codeMatch = allText.match(codePattern);
                        
                        if (codeMatch) {
                            const courseCode = codeMatch[1].replace(/\s+/g, '');
                            const courseTitle = lines.find(line => line.length > 10 && !codePattern.test(line))?.trim() || 'Unknown Course';
                            const isFull = allText.toLowerCase().includes('full') || allText.toLowerCase().includes('closed');
                            
                            courses.push({
                                code: courseCode,
                                title: courseTitle,
                                isFull: isFull,
                                index: index
                            });
                            
                            console.log(`Course ${index} (alt method): ${courseCode} - ${courseTitle} (${isFull ? 'FULL' : 'AVAILABLE'})`);
                        } else {
                            console.log(`⚠️ Could not extract info from course box ${index}`, box);
                        }
                    } else {
                        console.log(`⚠️ Could not extract info from course box ${index}`, box);
                    }
                }
            } catch (error) {
                console.error(`Error processing course box ${index}:`, error);
            }
        });

        console.log(`📊 Extracted ${courses.length} courses total`);
        return courses;
    }

    function sendAlertToServer(courses) {
        console.log('📧 Sending alert to server...', courses);
        
        return new Promise((resolve) => {
            if (typeof GM_xmlhttpRequest === 'undefined') {
                console.error('❌ GM_xmlhttpRequest not available');
                updateMonitorStatus('❌ GM_xmlhttpRequest not available');
                resolve(false);
                return;
            }

            console.log('📧 Making request to:', CONFIG.serverUrl);
            console.log('📧 With auth:', CONFIG.authToken);
            console.log('📧 Payload:', JSON.stringify(courses, null, 2));

            // Try with longer timeout for real alerts
            const alertTimeout = 30000; // 30 seconds for real alerts
            
            GM_xmlhttpRequest({
                method: "POST",
                url: CONFIG.serverUrl,
                data: JSON.stringify(courses),
                timeout: alertTimeout,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": CONFIG.authToken,
                    "Accept": "application/json",
                    "User-Agent": "UAlberta-Course-Monitor/1.7.2",
                    "Cache-Control": "no-cache"
                },
                onload: function(response) {
                    console.log('✅ Server response received:', {
                        status: response.status,
                        statusText: response.statusText,
                        responseText: response.responseText,
                        responseHeaders: response.responseHeaders
                    });
                    
                    if (response.status >= 200 && response.status < 300) {
                        updateMonitorStatus('📧 Email notification sent!');
                        resolve(true);
                    } else {
                        updateMonitorStatus(`⚠️ Server error: ${response.status}`);
                        console.error('Server error:', response.status, response.responseText);
                        resolve(false);
                    }
                },
                onerror: function(error) {
                    console.error('❌ Request failed:', error);
                    console.error('Error details:', {
                        readyState: error.readyState,
                        status: error.status,
                        statusText: error.statusText,
                        responseHeaders: error.responseHeaders
                    });
                    
                    // Try a retry with different approach
                    console.log('🔄 Attempting retry with simplified request...');
                    setTimeout(() => {
                        GM_xmlhttpRequest({
                            method: "POST",
                            url: CONFIG.serverUrl,
                            data: JSON.stringify(courses),
                            timeout: 15000,
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": CONFIG.authToken
                            },
                            onload: function(retryResponse) {
                                console.log('✅ Retry successful:', retryResponse.status);
                                updateMonitorStatus('📧 Email sent (after retry)');
                                resolve(true);
                            },
                            onerror: function() {
                                console.log('❌ Retry also failed');
                                updateMonitorStatus('❌ Server connection failed (retry failed)');
                                resolve(false);
                            }
                        });
                    }, 2000);
                },
                ontimeout: function() {
                    console.error('⏰ Request timed out after', alertTimeout, 'ms');
                    updateMonitorStatus('⏰ Server request timed out');
                    resolve(false);
                }
            });
        });
    }

    async function logAvailabilityNotification(coursesNowAvailable) {
        const timestamp = new Date().toLocaleString();

        console.log('\n🎉 COURSE SPOTS NOW AVAILABLE! 🎉');
        console.log('=====================================');
        console.log(coursesNowAvailable.map(c => `• ${c.code}: ${c.title}`).join('\n'));
        console.log(`Time: ${timestamp}`);
        console.log('=====================================\n');

        // Try to send to server
        const emailSent = await sendAlertToServer(coursesNowAvailable);

        // Update local history
        const alertEntry = {
            time: timestamp,
            courses: coursesNowAvailable,
            emailSent: emailSent
        };

        alertHistory.unshift(alertEntry);

        if (alertHistory.length > CONFIG.maxLogEntries) {
            alertHistory = alertHistory.slice(0, CONFIG.maxLogEntries);
        }

        localStorage.setItem('alertHistory', JSON.stringify(alertHistory));
        updateAlertHistoryUI();

        // Desktop notification
        showDesktopNotification(coursesNowAvailable);

        // Force update the UI immediately
        setTimeout(() => {
            updateAlertHistoryUI();
            const panel = document.getElementById('course-monitor-panel');
            if (panel) {
                panel.style.border = '3px solid #27ae60';
                setTimeout(() => {
                    panel.style.border = '2px solid #3498db';
                }, 2000);
            }
        }, 100);

        if (emailSent) {
            updateMonitorStatus('🎉 Notifications sent successfully!');
        } else {
            updateMonitorStatus('🎉 Alert logged (email delivery failed)');
        }
    }

    function updateAlertHistoryUI() {
        const historyElement = document.getElementById('alert-history');
        if (historyElement) {
            const historyHTML = formatAlertHistory();
            historyElement.innerHTML = historyHTML;
            console.log('📋 Alert history updated:', alertHistory.length, 'entries');
        } else {
            console.warn('⚠️ Alert history element not found');
        }
    }

    function showDesktopNotification(coursesNowAvailable) {
        const courseList = coursesNowAvailable.map(course => course.code).join(', ');

        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                title: 'UAlberta Course Spots Available!',
                text: `Courses now available: ${courseList}\nCheck BearTracks immediately!`,
                image: 'https://register.beartracks.ualberta.ca/favicon.ico',
                onclick: () => window.focus()
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('UAlberta Course Spots Available!', {
                body: `Courses now available: ${courseList}\nCheck BearTracks immediately!`,
                icon: 'https://register.beartracks.ualberta.ca/favicon.ico',
                requireInteraction: true
            });
        }
    }

    function updateMonitorStatus(message) {
        const statusElement = document.getElementById('monitor-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = message.includes('❌') ? '#e74c3c' :
                                      message.includes('✅') || message.includes('🎉') ? '#27ae60' :
                                      message.includes('⚠️') ? '#f39c12' : '#3498db';
        }
        console.log('📊 Status:', message);
    }

    function updateLastCheck() {
        const now = new Date().toLocaleString();
        localStorage.setItem('lastCheck', now);
        lastCheck = now;
        const lastCheckElement = document.getElementById('last-check');
        if (lastCheckElement) {
            lastCheckElement.textContent = `Last check: ${now}`;
        }
    }

    function updateCourseList(courses) {
        const listElement = document.getElementById('courses-being-monitored');
        if (listElement) {
            if (courses.length === 0) {
                listElement.innerHTML = '<div style="color: #bdc3c7;">No courses found on page</div>';
                return;
            }

            listElement.innerHTML = courses.map(course =>
                `<div style="margin: 2px 0; ${course.isFull ? 'color: #e74c3c;' : 'color: #27ae60;'}">
                    ${course.code} ${course.isFull ? '(Full)' : '(Available)'}
                </div>`
            ).join('');
        }
    }

    function checkCourseAvailability() {
        try {
            console.log('🔄 Checking course availability...');
            updateMonitorStatus('🔍 Checking course availability...');

            const currentCourses = extractCourseInfo();

            if (currentCourses.length === 0) {
                updateMonitorStatus('⚠️ No courses found on page');
                updateCourseList([]);
                console.log('⚠️ Page structure might have changed - no courses detected');
                return;
            }

            const coursesNowAvailable = [];

            currentCourses.forEach(course => {
                const previousStatus = courseStatuses[course.code];

                // Course changed from full to available
                if (previousStatus === true && !course.isFull) {
                    coursesNowAvailable.push(course);
                    console.log(`🎉 Course now available: ${course.code} - ${course.title}`);
                }

                courseStatuses[course.code] = course.isFull;
            });

            localStorage.setItem('courseStatuses', JSON.stringify(courseStatuses));

            if (coursesNowAvailable.length > 0) {
                logAvailabilityNotification(coursesNowAvailable);
            } else {
                updateLastCheck();
                updateCourseList(currentCourses);

                const availableCount = currentCourses.filter(c => !c.isFull).length;
                const totalCount = currentCourses.length;

                updateMonitorStatus(`📊 ${availableCount}/${totalCount} courses available`);
            }

        } catch (error) {
            console.error('❌ Error checking course availability:', error);
            updateMonitorStatus('❌ Error checking courses');
        }
    }

    function initializeMonitoring() {
        console.log('🚀 UAlberta Course Monitor starting (Fixed Version 1.7.2)...');
        console.log('Current URL:', window.location.href);
        console.log('Document ready state:', document.readyState);

        // Create panel immediately
        createMonitoringPanel();

        if (typeof GM_xmlhttpRequest === 'undefined') {
            console.warn('⚠️ GM_xmlhttpRequest not available - server notifications disabled');
            updateMonitorStatus('⚠️ No server access - install as Tampermonkey script');
        } else {
            console.log('✅ GM_xmlhttpRequest available');
            updateMonitorStatus('✅ Script loaded with server access');
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }

        // Start monitoring with a delay to ensure page is fully loaded
        setTimeout(() => {
            console.log('🔄 Starting initial check...');
            checkCourseAvailability();
        }, 3000);

        // Set up interval
        const intervalId = setInterval(checkCourseAvailability, CONFIG.checkInterval);
        console.log(`✅ Monitor initialized. Checking every ${CONFIG.checkInterval / 60000} minutes`);
        console.log('Interval ID:', intervalId);

        // Update status
        setTimeout(() => {
            updateMonitorStatus(`✅ Monitoring active (${CONFIG.checkInterval / 60000}min intervals)`);
        }, 5000);
    }

    // Add improved styles
    const style = document.createElement('style');
    style.textContent = `
        #course-monitor-panel {
            transition: all 0.3s ease !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        #course-monitor-panel:hover {
            transform: translateX(-5px) !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4) !important;
        }
        #course-monitor-panel button {
            font-size: 9px !important;
            transition: background 0.2s ease !important;
        }
        #course-monitor-panel button:hover {
            opacity: 0.8 !important;
            transform: scale(0.95) !important;
        }
    `;
    document.head.appendChild(style);

    // Multiple initialization attempts to ensure it works
    console.log('📍 Script execution point reached');

    if (document.readyState === 'loading') {
        console.log('⏳ Document still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', initializeMonitoring);
    } else {
        console.log('✅ Document ready, initializing immediately...');
        // Small delay to ensure everything is ready
        setTimeout(initializeMonitoring, 1000);
    }

    // Backup initialization in case the above doesn't work
    setTimeout(() => {
        if (!document.getElementById('course-monitor-panel')) {
            console.log('🔧 Backup initialization triggered');
            initializeMonitoring();
        }
    }, 5000);

    console.log('📝 Script setup complete');
})();