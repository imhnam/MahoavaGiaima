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
    const encryptionMethod = document.getElementById('encryption_method').value;

    if (this.value === 'random') {
        if (encryptionMethod === 'affine') {
            // Sinh khóa a ngẫu nhiên (a phải là số nguyên tố cùng nhau với 26)
            const validAValues = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];  // Các giá trị a hợp lệ
            const randomA = validAValues[Math.floor(Math.random() * validAValues.length)];
            document.getElementById('khoa_a').value = randomA;

            // Sinh khóa b ngẫu nhiên
            const randomB = Math.floor(Math.random() * 26);  // b có thể là bất kỳ giá trị nào từ 0 đến 25
            document.getElementById('khoa_b').value = randomB;
        } else {
            // Sinh khóa ngẫu nhiên cho phương thức mã hóa khác (ví dụ: Caesar)
            const randomKey = Math.floor(Math.random() * 26);
            document.getElementById('khoa').value = randomKey;
        }
    } else {
        // Xóa các giá trị khóa nếu người dùng chọn nhập thủ công
        document.getElementById('khoa').value = '';
        document.getElementById('khoa_a').value = '';
        document.getElementById('khoa_b').value = '';
    }
});

// Hiển thị hoặc ẩn các trường khóa a và b dựa trên phương thức mã hóa
document.getElementById('encryption_method').addEventListener('change', function () {
    const encryptionMethod = this.value;
    const affineKeyInputs = document.getElementById('affine_keys');
    if (encryptionMethod === 'affine') {
        affineKeyInputs.style.display = 'block';  // Hiển thị trường nhập cho Affine Cipher
    } else {
        affineKeyInputs.style.display = 'none';   // Ẩn trường nhập cho các phương thức khác
    }
});

// Function to display the result in the output area
function updateOutput(resultText) {
    document.getElementById('output_text').value = resultText;
}

// Function to check if two numbers are coprime
function gcd(a, b) {
    while (b != 0) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// Function to find modular inverse
function modInverse(a, m) {
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) {
            return x;
        }
    }
    throw new Error('Không tồn tại nghịch đảo modulo cho khóa a');
}

// Affine cipher function
function affineCipher(str, a, b, mode) {
    const alphabetSize = 26;
    let result = '';

    // Kiểm tra tính hợp lệ của a
    if (gcd(a, alphabetSize) !== 1) {
        throw new Error('Khóa a không hợp lệ. Nó phải nguyên tố cùng nhau với 26.');
    }

    if (mode === 'decrypt') {
        const aInverse = modInverse(a, alphabetSize);
        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);
            if (charCode >= 65 && charCode <= 90) {
                // Uppercase letters
                result += String.fromCharCode(((aInverse * (charCode - 65 - b + alphabetSize)) % alphabetSize) + 65);
            } else if (charCode >= 97 && charCode <= 122) {
                // Lowercase letters
                result += String.fromCharCode(((aInverse * (charCode - 97 - b + alphabetSize)) % alphabetSize) + 97);
            } else {
                result += str[i]; // Non-alphabet characters remain unchanged
            }
        }
    } else {
        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);
            if (charCode >= 65 && charCode <= 90) {
                result += String.fromCharCode(((a * (charCode - 65) + b) % alphabetSize) + 65);
            } else if (charCode >= 97 && charCode <= 122) {
                result += String.fromCharCode(((a * (charCode - 97) + b) % alphabetSize) + 97);
            } else {
                result += str[i]; // Non-alphabet characters remain unchanged
            }
        }
    }
    return result;
}

// Encrypt function
function encrypt() {
    let inputText = document.getElementById('input_text').value;
    let key = parseInt(document.getElementById('khoa').value);
    let encryptionMethod = document.getElementById('encryption_method').value;
    let encryptedText;

    if (encryptionMethod === 'affine') {
        let a = parseInt(document.getElementById('khoa_a').value);
        let b = parseInt(document.getElementById('khoa_b').value);

        // Kiểm tra khóa a và b hợp lệ
        if (isNaN(a) || isNaN(b) || a < 1 || b < 0 || b > 25) {
            alert('Khóa a và b không hợp lệ. a phải trong khoảng 1-25 và b phải trong khoảng 0-25');
            return;
        }
        try {
            encryptedText = affineCipher(inputText, a, b, 'encrypt');
        } catch (error) {
            alert(error.message);
            return;
        }
    } else if (encryptionMethod === 'caesar') {
        encryptedText = caesarCipher(inputText, key);
    } else if (encryptionMethod === 'substitution') {
        encryptedText = substitutionCipher(inputText, key, 'encrypt');
    }

    currentResult = encryptedText; // Set the result to be the encrypted text
    updateOutput(encryptedText);
}

// Decrypt function
function decrypt() {
    let encryptedText = document.getElementById('input_text').value;
    let key = parseInt(document.getElementById('khoa').value);
    let encryptionMethod = document.getElementById('encryption_method').value;
    let decryptedText;

    if (encryptionMethod === 'affine') {
        let a = parseInt(document.getElementById('khoa_a').value);
        let b = parseInt(document.getElementById('khoa_b').value);

        // Kiểm tra khóa a và b hợp lệ
        if (isNaN(a) || isNaN(b) || a < 1 || b < 0 || b > 25) {
            alert('Khóa a và b không hợp lệ. a phải trong khoảng 1-25 và b phải trong khoảng 0-25');
            return;
        }
        try {
            decryptedText = affineCipher(encryptedText, a, b, 'decrypt');
        } catch (error) {
            alert(error.message);
            return;
        }
    } else if (encryptionMethod === 'caesar') {
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
