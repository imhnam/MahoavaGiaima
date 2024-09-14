let fileContent = '';
let previousFileName = 'encrypted_text.txt'; // Default file name
let currentResult = '';  // Stores the current result to save (either encrypted or decrypted)

// Handle different file types: txt, docx, and pdf
document.getElementById('input_file').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'txt') {
            const reader = new FileReader();
            reader.onload = function (e) {
                fileContent = e.target.result;
                document.getElementById('input_text').value = fileContent;
            };
            reader.readAsText(file);
        } else if (fileExtension === 'docx') {
            const arrayBuffer = await file.arrayBuffer();
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => {
                    fileContent = result.value; // Extracted text
                    document.getElementById('input_text').value = fileContent;
                })
                .catch(err => {
                    console.error('Error reading .docx file:', err);
                });
        } else if (fileExtension === 'pdf') {
            const pdfDoc = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
            let pdfText = '';
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                textContent.items.forEach(item => {
                    pdfText += item.str + ' ';
                });
            }
            fileContent = pdfText.trim(); // Combine text from all pages
            document.getElementById('input_text').value = fileContent;
        } else {
            alert('Unsupported file format. Please upload a .txt, .docx, or .pdf file.');
        }
    }
});

// Generate random key when the key option is changed
document.getElementById('key_options').addEventListener('change', function () {
    if (this.value === 'random') {
        const randomKey = Math.floor(Math.random() * 26);
        document.getElementById('khoa').value = randomKey;
    } else {
        document.getElementById('khoa').value = '';
    }
});

// Function to display the result in the output area
function updateOutput(resultText) {
    document.getElementById('output_text').value = resultText;
}

// Caesar cipher function
function caesarCipher(str, key) {
    let result = '';
    key = key % 26; // Ensure the key wraps correctly
    for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
            // Uppercase letters
            result += String.fromCharCode(((charCode - 65 + key + 26) % 26) + 65);
        } else if (charCode >= 97 && charCode <= 122) {
            // Lowercase letters
            result += String.fromCharCode(((charCode - 97 + key + 26) % 26) + 97);
        } else {
            // Non-alphabet characters remain unchanged
            result += str.charAt(i);
        }
    }
    return result;
}

// Substitution cipher function (handles both encryption and decryption)
function substitutionCipher(str, key, mode) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let shiftedAlphabet = alphabet.split('').map((char, index) => {
        return alphabet[(index + key) % 26]; // Shift by key positions
    }).join('');

    if (mode === 'decrypt') {
        // Reverse the substitution for decryption
        return str.split('').map(char => {
            let lowerChar = char.toLowerCase();
            let index = shiftedAlphabet.indexOf(lowerChar);
            if (index === -1) {
                return char; // Non-alphabet characters remain unchanged
            }
            return alphabet[index];
        }).join('');
    } else {
        // Encrypt by shifting according to the shifted alphabet
        return str.split('').map(char => {
            let lowerChar = char.toLowerCase();
            let index = alphabet.indexOf(lowerChar);
            if (index === -1) {
                return char; // Non-alphabet characters remain unchanged
            }
            return shiftedAlphabet[index];
        }).join('');
    }
}

// Encrypt function
function encrypt() {
    let inputText = document.getElementById('input_text').value;
    let key = parseInt(document.getElementById('khoa').value);
    let encryptionMethod = document.getElementById('encryption_method').value;

    // Validate key
    if (isNaN(key) || key < 0 || key > 25) {
        alert('Khóa phải nằm trong khoảng từ 0 đến 25');
        return;
    }

    let encryptedText;
    if (encryptionMethod === 'caesar') {
        encryptedText = caesarCipher(inputText, key);
    } else if (encryptionMethod === 'substitution') {
        encryptedText = substitutionCipher(inputText, key, 'encrypt');
    }

    currentResult = encryptedText; // Set the result to be the encrypted text
    updateOutput(encryptedText);
}

// Decrypt function (fixes decryption issues)
function decrypt() {
    let encryptedText = document.getElementById('input_text').value;
    let key = parseInt(document.getElementById('khoa').value);
    let encryptionMethod = document.getElementById('encryption_method').value;

    // Validate key
    if (isNaN(key) || key < 0 || key > 25) {
        alert('Khóa phải nằm trong khoảng từ 0 đến 25');
        return;
    }

    let decryptedText;
    if (encryptionMethod === 'caesar') {
        decryptedText = caesarCipher(encryptedText, -key);  // Caesar cipher decryption
    } else if (encryptionMethod === 'substitution') {
        decryptedText = substitutionCipher(encryptedText, key, 'decrypt');  // Substitution cipher decryption
    }

    currentResult = decryptedText; // Set the result to be the decrypted text
    updateOutput(decryptedText);
}

// Save function triggered by the "Save" button
async function saveEncrypted() {
    let saveOption = document.getElementById('save_options').value;

    if (saveOption === 'no') {
        showNotification('Bạn đã chọn không lưu file.');
        return;
    }

    try {
        if ('showSaveFilePicker' in window) {
            const options = {
                suggestedName: previousFileName,
                types: [{
                    description: 'Text file',
                    accept: { 'text/plain': ['.txt'] }
                }]
            };

            const fileHandle = await window.showSaveFilePicker(options);
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(currentResult);
            await writableStream.close();

            previousFileName = fileHandle.name; // Update the previous file name
            showNotification('File đã được lưu thành công!');
        } else {
            // Fallback for browsers that don't support the File System API
            const blob = new Blob([currentResult], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = previousFileName;
            a.click();
            URL.revokeObjectURL(url);

            showNotification('File đã được lưu bằng phương pháp tải xuống dự phòng!');
        }
    } catch (error) {
        console.error('Lỗi khi lưu file:', error);
        showNotification('Lỗi khi lưu file.');
    }
}

// Show notification function
function showNotification(message) {
    const notification = document.querySelector('.notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
