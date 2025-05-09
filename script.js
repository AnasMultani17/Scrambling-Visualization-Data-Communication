document.addEventListener('DOMContentLoaded', () => {
    const bitInputElement = document.getElementById('bitInput');
    const plotButton = document.getElementById('plotButton');
    const visualizerSection = document.getElementById('visualizerSection');
    const b8zsButton = document.getElementById('b8zsButton');
    const hdb3Button = document.getElementById('hdb3Button');
    const playPauseButton = document.getElementById('playPauseButton');
    const speedControl = document.getElementById('speedControl');
    const speedValueSpan = document.getElementById('speedValue');
    
    const seekSlider = document.getElementById('seekSlider');
    const seekValueSpan = document.getElementById('seekValue');
    const seekMaxSpan = document.getElementById('seekMax');
    const resetButton = document.getElementById('resetButton');
    const statusTextSpan = document.getElementById('statusText');
    const stepInfoSpan = document.getElementById('stepInfo');
    const inputBitsDisplay = document.getElementById('inputBitsDisplay');
    const canvas = document.getElementById('signalCanvas');
    const ctx = canvas.getContext('2d');


    let bitStream = [];
    let processedAmiSignal = [];
    let substitutionInfo = [];
    let currentIndex = 0;
    let lastPulsePolarity = -1;
    let zeroCount = 0;
    let pulsesSinceLastV = 0;
    let isPlaying = false;
    let animationTimer = null;
    let currentAlgorithm = null;
    let animationSpeed = parseInt(speedControl.value, 10);

    const BIT_WIDTH = 40;
    const V_MARGIN = 30;
    const V_LEVEL_HEIGHT = 50;
    let canvasHeight = 2 * V_MARGIN + 2 * V_LEVEL_HEIGHT;
    let canvasWidth = 0;

    const colorZero = getComputedStyle(document.documentElement).getPropertyValue('--color-zero').trim();
    const colorHigh = getComputedStyle(document.documentElement).getPropertyValue('--color-high').trim();
    const colorLow = getComputedStyle(document.documentElement).getPropertyValue('--color-low').trim();
    const colorViolation = getComputedStyle(document.documentElement).getPropertyValue('--color-violation').trim();
    const colorGrid = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
    const colorCanvasBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim();

    plotButton.addEventListener('click', initializeVisualization);
    b8zsButton.addEventListener('click', () => selectAlgorithm('B8ZS'));
    hdb3Button.addEventListener('click', () => selectAlgorithm('HDB3'));
    playPauseButton.addEventListener('click', togglePlayPause);
    speedControl.addEventListener('input', updateSpeed);

    seekSlider.addEventListener('input', handleSeek);
    resetButton.addEventListener('click', resetVisualization);

    function initializeVisualization() {
        const inputString = bitInputElement.value.trim().replace(/[^01]/g, '');
        if (!inputString) {
            alert('Please enter a valid binary bit stream.');
            return;
        }
        bitInputElement.value = inputString;

        resetState(false);

        bitStream = inputString.split('').map(Number);

        visualizerSection.classList.remove('hidden');
        plotButton.disabled = true;
        bitInputElement.disabled = true;
        b8zsButton.disabled = false;
        hdb3Button.disabled = false;
        resetButton.disabled = false;
        seekSlider.max = bitStream.length > 0 ? bitStream.length : 0; 
        seekSlider.value = 0;
        seekSlider.disabled = bitStream.length === 0; 
        seekValueSpan.textContent = 0;
        seekMaxSpan.textContent = bitStream.length; 


        canvasWidth = bitStream.length * BIT_WIDTH;
        canvas.width = Math.max(canvasWidth, 300);
        canvas.height = canvasHeight;

        displayInputBits();

        updateStatus('Ready. Select B8ZS or HDB3.');
        clearCanvas();
        drawGrid();
    }

    function resetVisualization() {
        resetState(true);

        visualizerSection.classList.add('hidden');
        plotButton.disabled = false;
        bitInputElement.disabled = false;
        bitInputElement.value = '';
        b8zsButton.disabled = true;
        hdb3Button.disabled = true;
        playPauseButton.disabled = true;
        speedControl.disabled = true;
        resetButton.disabled = true;
        b8zsButton.classList.remove('active');
        hdb3Button.classList.remove('active');
        playPauseButton.textContent = 'Play';

        seekSlider.disabled = true;
        seekSlider.value = 0;
        seekSlider.max = 0;
        seekValueSpan.textContent = '0';
        seekMaxSpan.textContent = '0';

        updateStatus('Idle');
        stepInfoSpan.textContent = '-';
        inputBitsDisplay.innerHTML = '';
        clearCanvas();
        hideInputHighlight();
    }

     function resetState(fullReset = false) {
        clearTimeout(animationTimer);
        animationTimer = null;

        if (fullReset) {
            bitStream = [];
        }
        processedAmiSignal = [];
        substitutionInfo = [];
        currentIndex = 0;
        lastPulsePolarity = -1;
        zeroCount = 0;
        pulsesSinceLastV = 0;
        isPlaying = false;
        currentAlgorithm = null;

        playPauseButton.textContent = 'Play';
        playPauseButton.disabled = true;
        speedControl.disabled = true;
        b8zsButton.classList.remove('active');
        hdb3Button.classList.remove('active');
        b8zsButton.disabled = bitStream.length === 0; 
        hdb3Button.disabled = bitStream.length === 0; 


        seekSlider.value = 0;
        seekValueSpan.textContent = '0';
        if (fullReset) {
            seekSlider.max = 0;
            seekMaxSpan.textContent = '0';
            seekSlider.disabled = true;
        } else if (bitStream.length > 0) {
            seekSlider.max = bitStream.length;
            seekMaxSpan.textContent = bitStream.length;
            seekSlider.disabled = false;
        } else {
             seekSlider.max = 0;
             seekMaxSpan.textContent = '0';
             seekSlider.disabled = true;
        }
    


        if (!fullReset && bitStream.length > 0) {
             updateStatus('Ready. Select B8ZS or HDB3.');
             stepInfoSpan.textContent = '-';
             clearCanvas();
             drawGrid();
             hideInputHighlight();
             playPauseButton.disabled = true; 
             speedControl.disabled = true;
        } else if (fullReset) {
        
            updateStatus('Idle');
            stepInfoSpan.textContent = '-';
            inputBitsDisplay.innerHTML = '';
            clearCanvas();
            hideInputHighlight();
        }
    }

    function selectAlgorithm(algo) {
        if (isPlaying) {
            togglePlayPause();
        }

        processedAmiSignal = [];
        substitutionInfo = [];
        currentIndex = 0;
        lastPulsePolarity = -1;
        zeroCount = 0;
        pulsesSinceLastV = 0;

        currentAlgorithm = algo;
        b8zsButton.classList.toggle('active', algo === 'B8ZS');
        hdb3Button.classList.toggle('active', algo === 'HDB3');
        b8zsButton.disabled = true;
        hdb3Button.disabled = true;

        playPauseButton.disabled = false;
        speedControl.disabled = false;
        seekSlider.disabled = bitStream.length === 0;
        seekSlider.value = 0; 
        seekValueSpan.textContent = 0;

        updateStatus(`Algorithm ${algo} selected. Press Play.`);
        stepInfoSpan.textContent = '-';
        clearCanvas();
        drawGrid();
        hideInputHighlight();
    }

    function togglePlayPause() {
        if (!currentAlgorithm || bitStream.length === 0) return;

        isPlaying = !isPlaying;
        playPauseButton.textContent = isPlaying ? 'Pause' : 'Play';
        seekSlider.disabled = isPlaying;


        if (isPlaying) {
            updateStatus(`Running ${currentAlgorithm}...`);
            b8zsButton.disabled = true;
            hdb3Button.disabled = true;
            animationStep();
        } else {
            updateStatus('Paused.');
            clearTimeout(animationTimer);
            animationTimer = null;
            seekSlider.disabled = currentIndex >= bitStream.length;
        }
    }

    function updateSpeed() {
        animationSpeed = parseInt(speedControl.value, 10);
        speedValueSpan.textContent = `${animationSpeed} ms`;
    }

    function animationStep() {
        if (!isPlaying) { 
             clearTimeout(animationTimer);
             animationTimer = null;
             seekSlider.disabled = false; 
             return;
        }

        if (currentIndex >= bitStream.length) {
            updateStatus(`${currentAlgorithm} finished.`);
            isPlaying = false;
            playPauseButton.textContent = 'Play';
            playPauseButton.disabled = true; 
            hideInputHighlight();
            seekSlider.value = currentIndex; 
            seekValueSpan.textContent = currentIndex;
            seekSlider.disabled = false; 
            redrawCanvas(); 
            clearTimeout(animationTimer);
            animationTimer = null;
            return;
        }

        processNextBit(); 

        seekSlider.value = currentIndex;
        seekValueSpan.textContent = currentIndex;


        redrawCanvas(); 

        currentIndex++;

        animationTimer = setTimeout(animationStep, animationSpeed);
    }



    function processNextBit() {
        if (currentIndex >= bitStream.length) return;

        const bit = bitStream[currentIndex];
        let stepDescription = `Bit ${currentIndex}: Input ${bit}. `;
        let substitutionOccurred = false; 

        while (processedAmiSignal.length <= currentIndex) {
            processedAmiSignal.push(0); 
        }
        while (substitutionInfo.length <= currentIndex) {
            substitutionInfo.push(false); 
        }

        if (currentAlgorithm === 'B8ZS') {
            if (bit === 0) {
                zeroCount++;
                processedAmiSignal[currentIndex] = 0;
                substitutionInfo[currentIndex] = false; 

                if (zeroCount >= 8) {
                     let eightZeros = true;
                     for (let k = 1; k < 8; k++) {
                         if ((currentIndex - k < 0) || bitStream[currentIndex - k] !== 0) {
                             eightZeros = false;
                             break;
                         }
                     }

                     if (eightZeros) {
                         substitutionOccurred = true;
                         stepDescription += `Detected 8 zeros ending here. Polarity before zeros: ${lastPulsePolarity > 0 ? '+' : '-'}. Applying B8ZS: `;
                         const sub = (lastPulsePolarity > 0)
                             ? [0, 0, 0, 1, -1, 0, -1, 1] 
                             : [0, 0, 0, -1, 1, 0, 1, -1]; 
                         stepDescription += (lastPulsePolarity > 0) ? '000+-0-+' : '000-+0+-';

                         for (let i = 0; i < 8; i++) {
                             const targetIndex = currentIndex - 7 + i;
                             if (targetIndex >= 0) {
                                 processedAmiSignal[targetIndex] = sub[i];
                                 substitutionInfo[targetIndex] = true;
                             }
                         }
                         lastPulsePolarity = sub[7];
                         zeroCount = 0;
                         stepDescription += `. New expected polarity: ${lastPulsePolarity > 0 ? '+' : '-'}.`;

                     } else {
                        stepDescription += `Processing 0 (Zero count: ${zeroCount}).`;
                     }
                } else {
                     stepDescription += `Processing 0 (Zero count: ${zeroCount}).`;
                }
            } else {
                zeroCount = 0;
                lastPulsePolarity *= -1;
                processedAmiSignal[currentIndex] = lastPulsePolarity;
                substitutionInfo[currentIndex] = false;
                stepDescription += `Processing 1. Applying AMI: ${lastPulsePolarity > 0 ? '+' : '-'}.`;
            }

        } else if (currentAlgorithm === 'HDB3') {
            if (bit === 0) {
                zeroCount++;
                processedAmiSignal[currentIndex] = 0;
                substitutionInfo[currentIndex] = false;

                if (zeroCount >= 4) {
                    let fourZeros = true;
                    for (let k = 1; k < 4; k++) {
                        if ((currentIndex - k < 0) || bitStream[currentIndex - k] !== 0) {
                            fourZeros = false;
                            break;
                        }
                    }

                    if (fourZeros) {
                        substitutionOccurred = true;
                        stepDescription += `Detected 4 zeros ending here. Pulses since last V: ${pulsesSinceLastV}. Polarity before zeros: ${lastPulsePolarity > 0 ? '+' : '-'}. Applying HDB3: `;
                        let sub;
                        if (pulsesSinceLastV % 2 === 0) { 
                            sub = [-lastPulsePolarity, 0, 0, -lastPulsePolarity]; 
                            stepDescription += 'B00V';
                        } else { 
                            sub = [0, 0, 0, lastPulsePolarity]; 
                            stepDescription += '000V';
                        }

                        for (let i = 0; i < 4; i++) {
                            const targetIndex = currentIndex - 3 + i;
                            if (targetIndex >= 0) {
                                processedAmiSignal[targetIndex] = sub[i];
                                substitutionInfo[targetIndex] = true;
                            }
                        }
                        lastPulsePolarity = sub[3];
                        pulsesSinceLastV = 0;
                        zeroCount = 0;
                        stepDescription += `. New expected polarity: ${lastPulsePolarity > 0 ? '+' : '-'}.`;

                    } else {
                        stepDescription += `Processing 0 (Zero count: ${zeroCount}).`;
                    }
                } else {
                     stepDescription += `Processing 0 (Zero count: ${zeroCount}).`;
                }
            } else { 
                zeroCount = 0;
                lastPulsePolarity *= -1;
                pulsesSinceLastV++;
                processedAmiSignal[currentIndex] = lastPulsePolarity;
                substitutionInfo[currentIndex] = false;
                stepDescription += `Processing 1. Applying AMI: ${lastPulsePolarity > 0 ? '+' : '-'}. Pulses since V: ${pulsesSinceLastV}.`;
            }
        }

        stepInfoSpan.textContent = stepDescription;
        updateInputHighlight(currentIndex);
    }


    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = colorCanvasBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawGrid() {
        ctx.strokeStyle = colorGrid;
        ctx.lineWidth = 0.5;

        const yZero = V_MARGIN + V_LEVEL_HEIGHT;
        const yHigh = V_MARGIN;
        const yLow = V_MARGIN + 2 * V_LEVEL_HEIGHT;
        const effectiveCanvasWidth = bitStream.length * BIT_WIDTH;

        ctx.beginPath();
        ctx.moveTo(0, yZero);
        ctx.lineTo(effectiveCanvasWidth, yZero);
        ctx.stroke();

        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(0, yHigh);
        ctx.lineTo(effectiveCanvasWidth, yHigh);
        ctx.moveTo(0, yLow);
        ctx.lineTo(effectiveCanvasWidth, yLow);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        for (let i = 0; i <= bitStream.length; i++) {
            const x = i * BIT_WIDTH;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
        }
        ctx.stroke();
    }


    function redrawCanvas() {
        clearCanvas();
        drawGrid();
        drawSignal();
    }

    function drawSignal() {
        ctx.lineWidth = 2;
        const yZero = V_MARGIN + V_LEVEL_HEIGHT;
        const yHigh = V_MARGIN;
        const yLow = V_MARGIN + 2 * V_LEVEL_HEIGHT;

        let lastY = yZero;

        const drawLength = currentIndex; 
        for (let i = 0; i < processedAmiSignal.length && i < drawLength; i++) {
            const level = processedAmiSignal[i];
            const xStart = i * BIT_WIDTH;
            const xEnd = (i + 1) * BIT_WIDTH;
            let currentY = yZero;
            let color = colorZero;

            if (level === 1) {
                currentY = yHigh;
                color = colorHigh;
            } else if (level === -1) {
                currentY = yLow;
                color = colorLow;
            } else {
                currentY = yZero;
                color = colorZero;
            }

            ctx.strokeStyle = color;

            if (lastY === yZero && currentY !== yZero) { 
                 ctx.beginPath(); ctx.moveTo(xStart, lastY); ctx.lineTo(xStart, currentY); ctx.stroke();
            } else if (lastY !== yZero && currentY !== yZero && lastY !== currentY) { 
                 ctx.beginPath(); ctx.moveTo(xStart, lastY); ctx.lineTo(xStart, currentY); ctx.stroke();
            } else if (lastY !== yZero && currentY === yZero) { 
            }


            ctx.beginPath();
            ctx.moveTo(xStart, currentY);
            ctx.lineTo(xEnd, currentY);
            ctx.stroke();

            const nextLevel = (i + 1 < processedAmiSignal.length && i + 1 < drawLength) ? processedAmiSignal[i+1] : undefined;
            let nextY = yZero; 

            if(nextLevel !== undefined) {
                nextY = (nextLevel === 1) ? yHigh : (nextLevel === -1) ? yLow : yZero;
            } else {
                 nextY = (currentY !== yZero) ? yZero : yZero;
            }


             if (currentY !== yZero && nextY === yZero) { 
                 ctx.beginPath(); ctx.moveTo(xEnd, currentY); ctx.lineTo(xEnd, nextY); ctx.stroke();
             }


            if (i < substitutionInfo.length && substitutionInfo[i]) {
                ctx.fillStyle = colorViolation;
                ctx.fillRect(xStart + BIT_WIDTH / 2 - 3, currentY - 3, 6, 6);
            }

            lastY = currentY;
        }

        if (isPlaying && currentIndex < bitStream.length) {
            const cursorX = currentIndex * BIT_WIDTH;
            ctx.strokeStyle = colorViolation;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(cursorX, 0);
            ctx.lineTo(cursorX, canvasHeight);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }


     function displayInputBits() {
        inputBitsDisplay.innerHTML = '';
        bitStream.forEach((bit, index) => {
            const span = document.createElement('span');
            span.textContent = bit;
            span.dataset.index = index;
            inputBitsDisplay.appendChild(span);
        });

        let highlightBox = document.getElementById('inputHighlightBox');
        if (!highlightBox) {
             highlightBox = document.createElement('div');
             highlightBox.id = 'inputHighlightBox';
             highlightBox.className = 'highlight-box';
             inputBitsDisplay.style.position = 'relative';
             inputBitsDisplay.appendChild(highlightBox);
        }
        hideInputHighlight();
    }

    function updateInputHighlight(index) {
         const highlightBox = document.getElementById('inputHighlightBox');
         if (!highlightBox || index >= bitStream.length || index < 0) {
             hideInputHighlight();
             return;
         }

         const spanElements = inputBitsDisplay.querySelectorAll('span');
         if (index < spanElements.length) {
             const targetSpan = spanElements[index];
             const spanRect = targetSpan.getBoundingClientRect();
             const containerRect = inputBitsDisplay.getBoundingClientRect();

             const left = spanRect.left - containerRect.left;
             const top = spanRect.top - containerRect.top;
             const width = spanRect.width;
             const height = spanRect.height;

             const computedStyle = getComputedStyle(inputBitsDisplay);
             const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

             highlightBox.style.left = `${left + inputBitsDisplay.scrollLeft}px`;
             highlightBox.style.top = `${top}px`;
             highlightBox.style.width = `${width}px`;
             highlightBox.style.height = `${height}px`;
             highlightBox.style.opacity = '1';
         } else {
             hideInputHighlight();
         }
     }

    function hideInputHighlight() {
        const highlightBox = document.getElementById('inputHighlightBox');
        if (highlightBox) {
            highlightBox.style.opacity = '0';
        }
    }

    function updateStatus(message) {
        statusTextSpan.textContent = message;
    }

    function saveCurrentProcessingState() {
        return {
            processedAmiSignal: [...processedAmiSignal],
            substitutionInfo: [...substitutionInfo],
            lastPulsePolarity,
            zeroCount,
            pulsesSinceLastV,
            currentIndex 
        };
    }

    function restoreProcessingState(state) {
        processedAmiSignal = state.processedAmiSignal;
        substitutionInfo = state.substitutionInfo;
        lastPulsePolarity = state.lastPulsePolarity;
        zeroCount = state.zeroCount;
        pulsesSinceLastV = state.pulsesSinceLastV;
        currentIndex = state.currentIndex; 
    }


    function recalculateStateUpTo(targetIndex) {
        processedAmiSignal = [];
        substitutionInfo = [];
        let tempLastPulsePolarity = -1;
        let tempZeroCount = 0;
        let tempPulsesSinceLastV = 0;

        for (let i = 0; i < targetIndex; i++) {
            if (i >= bitStream.length) break;

            const bit = bitStream[i];

            while (processedAmiSignal.length <= i) processedAmiSignal.push(0);
            while (substitutionInfo.length <= i) substitutionInfo.push(false);


             if (currentAlgorithm === 'B8ZS') {
                    if (bit === 0) {
                        tempZeroCount++;
                        processedAmiSignal[i] = 0;
                        substitutionInfo[i] = false;
                        if (tempZeroCount >= 8) {
                             let eightZeros = true;
                             for (let k = 1; k < 8; k++) if ((i - k < 0) || bitStream[i - k] !== 0) { eightZeros = false; break; }
                             if (eightZeros) {
                                const sub = (tempLastPulsePolarity > 0) ? [0, 0, 0, 1, -1, 0, -1, 1] : [0, 0, 0, -1, 1, 0, 1, -1];
                                for (let j = 0; j < 8; j++) {
                                    const idx = i - 7 + j;
                                    if (idx >= 0) { processedAmiSignal[idx] = sub[j]; substitutionInfo[idx] = true; }
                                }
                                tempLastPulsePolarity = sub[7];
                                tempZeroCount = 0;
                             }
                         }
                    } else {
                        tempZeroCount = 0; tempLastPulsePolarity *= -1;
                        processedAmiSignal[i] = tempLastPulsePolarity; substitutionInfo[i] = false;
                    }
                } else if (currentAlgorithm === 'HDB3') {
                     if (bit === 0) {
                         tempZeroCount++;
                         processedAmiSignal[i] = 0; substitutionInfo[i] = false;
                         if (tempZeroCount >= 4) {
                              let fourZeros = true;
                              for (let k = 1; k < 4; k++) if ((i - k < 0) || bitStream[i - k] !== 0) { fourZeros = false; break; }
                              if(fourZeros){
                                 let sub;
                                 if (tempPulsesSinceLastV % 2 === 0) { sub = [-tempLastPulsePolarity, 0, 0, -tempLastPulsePolarity]; }
                                 else { sub = [0, 0, 0, tempLastPulsePolarity]; }
                                 for (let j = 0; j < 4; j++) {
                                     const idx = i - 3 + j;
                                     if (idx >= 0) { processedAmiSignal[idx] = sub[j]; substitutionInfo[idx] = true; }
                                 }
                                 tempLastPulsePolarity = sub[3]; tempPulsesSinceLastV = 0; tempZeroCount = 0;
                              }
                         }
                     } else {
                         tempZeroCount = 0; tempLastPulsePolarity *= -1; tempPulsesSinceLastV++;
                         processedAmiSignal[i] = tempLastPulsePolarity; substitutionInfo[i] = false;
                     }
                }
        } 
         processedAmiSignal.length = targetIndex;
         substitutionInfo.length = targetIndex;
        lastPulsePolarity = tempLastPulsePolarity;
        zeroCount = tempZeroCount;
        pulsesSinceLastV = tempPulsesSinceLastV;
    }

    function handleSeek() {
        const targetIndex = parseInt(seekSlider.value, 10);

        if (isPlaying) {
             togglePlayPause();
        }

        recalculateStateUpTo(targetIndex);

        currentIndex = targetIndex;
        seekValueSpan.textContent = targetIndex;
        redrawCanvas(); 

        if (currentIndex < bitStream.length) {
      
             const tempState = saveCurrentProcessingState();
             processNextBit(); 
             restoreProcessingState(tempState); 
             updateInputHighlight(currentIndex);
             updateStatus(`Seeked to index ${currentIndex}. Ready to play.`);
        } else {
             stepInfoSpan.textContent = `Seeked to end (after index ${currentIndex - 1})`;
             hideInputHighlight();
             updateStatus('Seeked to end.');
        }

        playPauseButton.textContent = 'Play'; 
        playPauseButton.disabled = (currentIndex >= bitStream.length || !currentAlgorithm);
        seekSlider.disabled = false;


    }


}); 