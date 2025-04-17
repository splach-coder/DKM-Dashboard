document.addEventListener('DOMContentLoaded', function() {
    // Initialize PanZoom with boundaries
    const flowCanvas = document.getElementById('flow-canvas');
    const canvasContainer = document.querySelector('.canvas-container');
    
    // Set canvas dimensions to match container
    flowCanvas.style.width = canvasContainer.offsetWidth + 'px';
    flowCanvas.style.height = canvasContainer.offsetHeight + 'px';

    const panZoomInstance = panzoom(flowCanvas, {
        maxZoom: 3,
        minZoom: 0.3,
        zoomSpeed: 0.1,
        bounds: true,
        boundsPadding: 0.5,
        smoothScroll: false
    });

    // Cache DOM elements
    const modal = document.getElementById('logicAppModal');
    const modalTitle = document.getElementById('modal-title');
    const finalResultContainer = document.getElementById('final-result-container');
    const closeBtn = document.getElementById('close-modal-btn');
    const sendReportBtn = document.getElementById('send-report-btn');
    const emailStatus = document.getElementById('email-status');
    const emailStatusMessage = emailStatus.querySelector('.email-status-message');

    // Current run data and configuration
    let currentRunData = null;
    let leaderLines = [];
    const VERTICAL_GAP = 120;
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 80;
    const INITIAL_TOP_MARGIN = 50;
    
    // Simplified step names for better UX
    const STEP_NAMES = {
        'greeting': 'Welcome',
        'catalogue': 'Catalog Search',
        'tracking': 'Package Tracking',
        'contact': 'Contact Request',
        'email': 'Email Processing',
        'azureFunction': 'Data Extraction',
        'outputExcel': 'Excel Generation',
        'default': 'Processing Step'
    };

    // Step icons with corresponding colors
    const STEP_ICONS = {
        'greeting': '<i class="fas fa-handshake"></i>',
        'catalogue': '<i class="fas fa-book-open"></i>',
        'tracking': '<i class="fas fa-truck-fast"></i>',
        'contact': '<i class="fas fa-headset"></i>',
        'email': '<i class="fas fa-envelope-open-text" style="color: #3686c4;"></i>',
        'azureFunction': '<i class="fa-solid fa-bolt" style="color: #3686c4;"></i>',
        'outputExcel': '<i class="fa-solid fa-file-excel" style="color: #00bd84;"></i>',
        'default': '<i class="fas fa-cogs"></i>'
    };
    
    // Colors for specific steps to match application colors
    const STEP_COLORS = {
        'email': '#0078D4',
        'azureFunction': '#0089D6',
        'outputExcel': '#217346',
        'default': '#95a5a6'
    };

    // Event Handlers
    document.addEventListener('runSelected', function(event) {
        currentRunData = event.detail;
        modalTitle.innerHTML = currentRunData.companyName + ' / '+ '<span style="font-size: 14px; color: #3686c4;">(' + formatTimestamp(currentRunData.logicAppTimestamp) + ')</span>';
        clearFlowCanvas();
        createFlowNodes(currentRunData);
        updateFinalResult(currentRunData.finalResult);
        modal.classList.add('active');
    });

    function clearFlowCanvas() {
        flowCanvas.innerHTML = '';
        leaderLines.forEach(line => {
            if (line && typeof line.remove === 'function') {
                line.remove();
            }
        });
        leaderLines = [];
        panZoomInstance.zoomAbs(0, 0, 1);
        panZoomInstance.moveTo(0, 0);
    }

    function createFlowNodes(runData) {
        const nodeTemplate = document.getElementById('node-template');
        const nodes = [];
        
        // Use the steps in their original order (reverse chronological)
        const steps = runData.Steps;
        
        // First, create all nodes
        steps.forEach((step, index) => {
            const stepType = Object.keys(step)[0];
            const stepData = step[stepType];
            const nodeElement = document.importNode(nodeTemplate.content, true).querySelector('.flow-node');

            // Node setup
            nodeElement.dataset.stepIndex = index;
            nodeElement.style.left = `${45}%`;
            nodeElement.style.top = `${INITIAL_TOP_MARGIN + (index * VERTICAL_GAP)}px`;
            nodeElement.style.width = `${NODE_WIDTH}px`;
            nodeElement.style.height = `${NODE_HEIGHT}px`;
            nodeElement.classList.add(`node-${stepType.toLowerCase()}`);
            
            const borderColor = STEP_COLORS[stepType] || STEP_COLORS.default;
            nodeElement.style.borderTopColor = borderColor;

            // Simplified content
            const isSuccess = stepData.status === 'Success';
            nodeElement.innerHTML = `
                <div class="node-header">
                    <span class="node-icon">${STEP_ICONS[stepType] || STEP_ICONS.default}</span>
                    <span class="node-title">${STEP_NAMES[stepType] || STEP_NAMES.default}</span>
                </div>
                <div class="node-status">
                    <span class="status-icon">${isSuccess ? 
                        '<i class="fa-solid fa-circle-check" style="color: #16C60C;"></i>' : 
                        '<i class="fa-solid fa-circle-xmark" style="color: #f02424;"></i>'}</span>
                    <span class="status-text">${isSuccess ? 'Success' : 'Failed'}</span>
                </div>
            `;

            if (isSuccess) {
                nodeElement.classList.add('success');
            } else {
                nodeElement.classList.add('failure');
            }

            flowCanvas.appendChild(nodeElement);
            nodes.push(nodeElement);
        });
        
        // Then create connectors in the right order (from first to last)
        for (let i = 0; i < nodes.length - 1; i++) {
            const line = createLeaderLine(nodes[i], nodes[i + 1]);
            leaderLines.push(line);
        }

        // Center the flow after creation
        centerFlow();
    }

    function createLeaderLine(fromNode, toNode) {
        const line = new LeaderLine(
            fromNode,
            toNode,
            {
                color: '#6b7280',
                size: 3,
                path: 'straight',
                startSocket: 'bottom',
                endSocket: 'top',
                startSocketGravity: [0, 20],
                endSocketGravity: [0, -20],
                dash: false,
                startPlug: 'behind',
                endPlug: 'arrow1',
                endPlugSize: 2,
                hide: false,
                zIndex: 10
            }
        );
        
        // Force visibility
        line.show();
        return line;
    }

    function centerFlow() {
        const nodes = flowCanvas.querySelectorAll('.flow-node');
        if (nodes.length === 0) return;

        const firstNode = nodes[0];
        const lastNode = nodes[nodes.length - 1];
        const canvasHeight = flowCanvas.offsetHeight;
        const contentHeight = lastNode.offsetTop + lastNode.offsetHeight - firstNode.offsetTop;
        
        // Calculate vertical centering with padding
        const targetY = Math.max((canvasHeight - contentHeight) / 2, 20);
        const offsetY = targetY - firstNode.offsetTop;

        // Apply centering to all nodes
        nodes.forEach(node => {
            const currentTop = parseInt(node.style.top);
            node.style.top = `${currentTop + offsetY}px`;
        });

        // Update all leader lines
        setTimeout(() => {
            leaderLines.forEach(line => {
                if (line && typeof line.position === 'function') {
                    line.position();
                }
            });
        }, 50);
    }

    function updateFinalResult(finalResult) {
        finalResultContainer.innerHTML = `
            <div class="final-result ${finalResult.allStepsSucceeded ? 'success' : 'failure'}">
                <span class="result-icon">${finalResult.allStepsSucceeded ? 
                    '<i class="fa-solid fa-circle-check" style="color: #16C60C;"></i>' : 
                    '<i class="fa-solid fa-circle-xmark" style="color: #f02424;"></i>'}</span>
                <span class="result-text">${finalResult.allStepsSucceeded ? 'All Steps Completed Successfully' : 'Workflow Failed'}</span>
            </div>
        `;
    }

    // Helper functions
    function formatTimestamp(timestamp) {
        try { return new Date(timestamp).toLocaleString(); }
        catch (e) { return timestamp; }
    }

    // Event Listeners
    closeBtn.addEventListener('click', () => {
        leaderLines.forEach(line => {
            if (line && typeof line.remove === 'function') {
                line.remove();
            }
        });
        leaderLines = [];
        modal.classList.remove('active');
    });

    document.getElementById('zoom-in').addEventListener('click', () => {
        panZoomInstance.smoothZoom(flowCanvas.clientWidth / 2, flowCanvas.clientHeight / 2, 1.2);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        panZoomInstance.smoothZoom(flowCanvas.clientWidth / 2, flowCanvas.clientHeight / 2, 0.8);
    });

    document.getElementById('zoom-reset').addEventListener('click', () => {
        panZoomInstance.zoomAbs(0, 0, 1);
        panZoomInstance.moveTo(0, 0);
    });

    sendReportBtn.addEventListener('click', function() {
        if (!currentRunData) return;
        const checkerEmail = 'anas.benabbou@dkm-customs.com';

        this.disabled = true;
        this.innerHTML = '<span class="btn-icon">⏳</span> Sending...';

        fetch('/api/send-report', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({runData: currentRunData, email: checkerEmail})
        }).then(response => {
            if (!response.ok) throw new Error('Failed to send email');
            showEmailStatus('Email sent successfully to ' + checkerEmail, 'success');
        }).catch(error => {
            console.error('Error:', error);
            showEmailStatus('Failed to send email. Opening mail client...', 'error');
            const subject = encodeURIComponent(`Logic App Run: ${currentRunData.LogicAppName}`);
            const body = encodeURIComponent(formatEmailBody(currentRunData));
            window.location.href = `mailto:${checkerEmail}?subject=${subject}&body=${body}`;
        }).finally(() => {
            this.disabled = false;
            this.innerHTML = '<span class="btn-icon"><i class="fa-solid fa-envelope" style="color: #ffffff;"></i></span> Send Report';
        });
    });

    function showEmailStatus(message, type) {
        emailStatusMessage.textContent = message;
        emailStatus.className = `email-status ${type}`;
        emailStatus.style.display = 'block';
        setTimeout(() => emailStatus.style.display = 'none', 3000);
    }

    function formatEmailBody(runData) {
        return `Logic App Run Details:
            \n\nLogic App: ${runData.LogicAppName}
            \nRun ID: ${runData.runId}
            \nTimestamp: ${runData.logicAppTimestamp}
            \n\nSteps:${runData.Steps.map((step, index) => {
                const stepType = Object.keys(step)[0];
                return `\n${index + 1}. ${STEP_NAMES[stepType] || stepType} - ${step[stepType].status}`;
            }).join('')}`;
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            leaderLines.forEach(line => {
                if (line && typeof line.remove === 'function') {
                    line.remove();
                }
            });
            leaderLines = [];
            modal.classList.remove('active');
        }
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            leaderLines.forEach(line => {
                if (line && typeof line.remove === 'function') {
                    line.remove();
                }
            });
            leaderLines = [];
            modal.classList.remove('active');
        }
    });

    // Update leader lines on zoom/pan
    panZoomInstance.on('transform', () => {
        leaderLines.forEach(line => {
            if (line && typeof line.position === 'function') {
                line.position();
            }
        });
    });
    
    // Make sure leader lines are updated if window is resized
    window.addEventListener('resize', () => {
        setTimeout(() => {
            leaderLines.forEach(line => {
                if (line && typeof line.position === 'function') {
                    line.position();
                }
            });
        }, 100);
    });
});