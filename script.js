document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);

// 背景色の初期値
let backgrounds = ['#FFFFFF', '#808080', '#000000'];

// 色の出現回数を追跡する関数
function getColorFrequency(imageData) {
    const colorCount = new Map();

    for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i + 3] === 0) continue; // 透明ピクセルをスキップ
        const hex = rgbToHex(imageData[i], imageData[i + 1], imageData[i + 2]);
        colorCount.set(hex, (colorCount.get(hex) || 0) + 1);
    }

    // 出現頻度でソートし、上位10色を取得
    return Array.from(colorCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([color]) => color);
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // すべての背景にロゴを表示
            for (let i = 1; i <= 3; i++) {
                document.getElementById(`logo${i}`).src = img.src;
            }

            // 色の抽出とコントラスト計算
            extractColors(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function extractColors(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // 頻度ベースで主要な色を取得
    const mainColors = getColorFrequency(imageData);

    // 各背景色に対して色情報を表示
    backgrounds.forEach((bg, index) => {
        displayColorInfo(mainColors, bg, index + 1);
    });
}

// 背景色を変更する関数
function updateBackground(index) {
    const color = document.getElementById(`bgColor${index}`).value;
    backgrounds[index - 1] = color;
    document.querySelector(`.logo-container:nth-child(${index}) .background`)
        .style.backgroundColor = color;

    // 色情報を更新
    const img = document.getElementById(`logo${index}`);
    if (img.src) {
        extractColors(img);
    }
}

// カラーピッカーからの更新
function updateBackgroundFromPicker(index) {
    const color = document.getElementById(`bgColor${index}`).value;
    document.getElementById(`bgColorCode${index}`).value = color.toUpperCase();
    updateBackground(index);
}

// カラーコード入力からの更新
function updateBackgroundFromInput(index) {
    const input = document.getElementById(`bgColorCode${index}`);
    let color = input.value.trim();

    // #が先頭についていない場合は追加
    if (!color.startsWith('#')) {
        color = '#' + color;
    }

    // カラーコードの形式を検証
    const isValid = /^#[0-9A-Fa-f]{6}$/.test(color);

    if (isValid) {
        input.value = color.toUpperCase();
        document.getElementById(`bgColor${index}`).value = color;
        updateBackground(index);
    } else {
        alert('有効なカラーコードを入力してください（例：#FF0000）');
        // 前回の有効な値に戻す
        input.value = backgrounds[index - 1];
    }
}

function calculateRelativeLuminance(r, g, b) {
    // RGB値をsRGBに変換
    r = r / 255;
    g = g / 255;
    b = b / 255;

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateContrastRatio(color1, color2) {
    const l1 = calculateRelativeLuminance(...hexToRgb(color1));
    const l2 = calculateRelativeLuminance(...hexToRgb(color2));

    // 明るい色をL1として使用
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

function getContrastRating(ratio) {
    if (ratio >= 7.0) return 'Best👏';
    if (ratio >= 4.5) return 'Good👍';
    return 'Bad..';
}

function displayColorInfo(colors, background, containerIndex) {
    const container = document.getElementById(`colorInfo${containerIndex}`);
    container.innerHTML = '';

    colors.forEach(color => {
        const ratio = calculateContrastRatio(color, background);
        const row = document.createElement('div');
        row.className = 'color-row';

        const sample = document.createElement('div');
        sample.className = 'color-sample';
        sample.style.backgroundColor = color;

        row.innerHTML = `
            ${sample.outerHTML}
            <span>${color}</span>
            <span>コントラスト比: ${ratio.toFixed(2)}:1</span>
            <span>${getContrastRating(ratio)}</span>
        `;

        container.appendChild(row);
    });
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ];
}
