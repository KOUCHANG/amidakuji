let participants = [];
let results = [];
let horizontalLines = [];
let canvas, ctx;
let config = {
    lineWidth: 3,
    verticalLineColor: '#333',
    horizontalLineColor: '#667eea',
    highlightColor: '#ff6b6b',
    participantColor: '#2c3e50',
    resultColor: '#27ae60',
    padding: 60,
    verticalSpacing: 120,
    horizontalSpacing: 40,
    animationSpeed: 5
};

function generateAmidakuji() {
    const participantInput = document.getElementById('participants').value.trim();
    const resultInput = document.getElementById('results').value.trim();
    const lineCount = parseInt(document.getElementById('lineCount').value);
    
    if (!participantInput || !resultInput) {
        alert('参加者と結果を入力してください。');
        return;
    }
    
    participants = participantInput.split(',').map(p => p.trim()).filter(p => p);
    results = resultInput.split(',').map(r => r.trim()).filter(r => r);
    
    if (participants.length !== results.length) {
        alert('参加者と結果の数を同じにしてください。');
        return;
    }
    
    if (participants.length < 2) {
        alert('参加者は2人以上必要です。');
        return;
    }
    
    generateHorizontalLines(lineCount);
    
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
    
    drawAmidakuji();
}

function generateHorizontalLines(count) {
    horizontalLines = [];
    const numPaths = participants.length;
    const maxHeight = config.horizontalSpacing * (count + 2);
    
    for (let i = 0; i < count; i++) {
        const y = config.padding + config.horizontalSpacing * (i + 1);
        const startColumn = Math.floor(Math.random() * (numPaths - 1));
        
        // 同じ高さに複数の線が重ならないように
        let attempts = 0;
        let validLine = false;
        let column = startColumn;
        
        while (!validLine && attempts < 10) {
            validLine = true;
            for (let line of horizontalLines) {
                if (Math.abs(line.y - y) < config.horizontalSpacing * 0.3 && line.column === column) {
                    validLine = false;
                    column = Math.floor(Math.random() * (numPaths - 1));
                    break;
                }
            }
            attempts++;
        }
        
        if (validLine) {
            horizontalLines.push({ y, column });
        }
    }
    
    horizontalLines.sort((a, b) => a.y - b.y);
}

function drawAmidakuji() {
    canvas = document.getElementById('amidakujiCanvas');
    ctx = canvas.getContext('2d');
    
    const numPaths = participants.length;
    const canvasWidth = config.padding * 2 + config.verticalSpacing * (numPaths - 1);
    const canvasHeight = config.padding * 2 + config.horizontalSpacing * (horizontalLines.length + 2);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 縦線を描画
    ctx.strokeStyle = config.verticalLineColor;
    ctx.lineWidth = config.lineWidth;
    
    for (let i = 0; i < numPaths; i++) {
        const x = config.padding + i * config.verticalSpacing;
        ctx.beginPath();
        ctx.moveTo(x, config.padding);
        ctx.lineTo(x, canvas.height - config.padding);
        ctx.stroke();
    }
    
    // 横線を描画
    ctx.strokeStyle = config.horizontalLineColor;
    for (let line of horizontalLines) {
        const x1 = config.padding + line.column * config.verticalSpacing;
        const x2 = x1 + config.verticalSpacing;
        
        ctx.beginPath();
        ctx.moveTo(x1, line.y);
        ctx.lineTo(x2, line.y);
        ctx.stroke();
    }
    
    // 参加者名を描画
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.participantColor;
    ctx.textAlign = 'center';
    
    for (let i = 0; i < participants.length; i++) {
        const x = config.padding + i * config.verticalSpacing;
        ctx.fillText(participants[i], x, config.padding - 20);
    }
    
    // 結果を描画（最初は隠す）
    ctx.fillStyle = config.resultColor;
    for (let i = 0; i < results.length; i++) {
        const x = config.padding + i * config.verticalSpacing;
        // 結果は最初は表示しない
    }
    
    // クリックイベントを追加
    canvas.onclick = handleCanvasClick;
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 参加者名がクリックされたかチェック
    for (let i = 0; i < participants.length; i++) {
        const participantX = config.padding + i * config.verticalSpacing;
        if (Math.abs(x - participantX) < 30 && y < config.padding) {
            tracePathWithAnimation(i);
            break;
        }
    }
}

function tracePathWithAnimation(startIndex) {
    const path = tracePath(startIndex);
    let currentStep = 0;
    
    function animate() {
        if (currentStep < path.length - 1) {
            drawAmidakuji();
            
            ctx.strokeStyle = config.highlightColor;
            ctx.lineWidth = config.lineWidth + 2;
            
            for (let i = 0; i <= currentStep; i++) {
                const point1 = path[i];
                const point2 = path[i + 1];
                
                if (point2) {
                    ctx.beginPath();
                    ctx.moveTo(point1.x, point1.y);
                    ctx.lineTo(point2.x, point2.y);
                    ctx.stroke();
                }
            }
            
            currentStep++;
            setTimeout(animate, 50);
        } else {
            // アニメーション終了後、結果を表示
            const endIndex = path[path.length - 1].column;
            showResult(startIndex, endIndex);
        }
    }
    
    animate();
}

function tracePath(startColumn) {
    let currentColumn = startColumn;
    let currentY = config.padding;
    const path = [{ x: config.padding + currentColumn * config.verticalSpacing, y: currentY, column: currentColumn }];
    
    for (let line of horizontalLines) {
        // 現在の列から横線がある場合
        if (line.column === currentColumn) {
            // 横線の手前まで移動
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
            // 右に移動
            currentColumn++;
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
        } 
        // 左から来る横線がある場合
        else if (line.column === currentColumn - 1) {
            // 横線の手前まで移動
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
            // 左に移動
            currentColumn--;
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
        } else {
            // 横線がない場合は通過
            if (line.y > currentY) {
                currentY = line.y;
            }
        }
    }
    
    // 最後まで移動
    path.push({ 
        x: config.padding + currentColumn * config.verticalSpacing, 
        y: canvas.height - config.padding,
        column: currentColumn
    });
    
    return path;
}

function showResult(startIndex, endIndex) {
    const resultsDisplay = document.getElementById('resultsDisplay');
    resultsDisplay.style.display = 'block';
    
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `<strong>${participants[startIndex]}</strong> → ${results[endIndex]}`;
    
    resultsDisplay.appendChild(resultItem);
    
    // 結果をキャンバスにも表示
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.resultColor;
    ctx.textAlign = 'center';
    const x = config.padding + endIndex * config.verticalSpacing;
    ctx.fillText(results[endIndex], x, canvas.height - config.padding + 30);
}

function revealAll() {
    const resultsDisplay = document.getElementById('resultsDisplay');
    resultsDisplay.innerHTML = '';
    resultsDisplay.style.display = 'block';
    
    for (let i = 0; i < participants.length; i++) {
        const path = tracePath(i);
        const endIndex = path[path.length - 1].column;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `<strong>${participants[i]}</strong> → ${results[endIndex]}`;
        resultItem.style.animationDelay = `${i * 0.1}s`;
        
        resultsDisplay.appendChild(resultItem);
    }
    
    // すべての結果をキャンバスに表示
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.resultColor;
    ctx.textAlign = 'center';
    
    for (let i = 0; i < participants.length; i++) {
        const path = tracePath(i);
        const endIndex = path[path.length - 1].column;
        const x = config.padding + endIndex * config.verticalSpacing;
        ctx.fillText(results[endIndex], x, canvas.height - config.padding + 30);
    }
}

function resetGame() {
    document.getElementById('setupSection').style.display = 'block';
    document.getElementById('gameSection').style.display = 'none';
    document.getElementById('resultsDisplay').innerHTML = '';
    document.getElementById('resultsDisplay').style.display = 'none';
}
