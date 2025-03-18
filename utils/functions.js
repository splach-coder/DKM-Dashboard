function normalizeKeys(obj) {
    const normalized = {};
    for (let key in obj) {
      let newKey = key.replace(/\s+/g, '_'); // Replace spaces with underscores
      newKey = newKey.replace(' ', ''); // Replace spaces with underscores
      normalized[newKey] = obj[key];
    }
    return normalized;
}

function validateContainerNumber(containerNumber) {
    // Ensure the container number is in uppercase and remove any non-alphanumeric characters
    containerNumber = containerNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Regular expression to match the ISO 6346 format
    const regex = /^[A-Z]{3}[UJZ][0-9]{6}[0-9]$/;

    // Check if the container number matches the required format
    if (!regex.test(containerNumber)) {
        return { isValid: false, message: 'Invalid format' };
    }

    // Characters to numerical values mapping based on ISO 6346
    const charValues = {
        'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19,
        'J': 20, 'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29,
        'S': 30, 'T': 31, 'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38
    };

    // Calculate the check digit
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        let char = containerNumber.charAt(i);
        let value = isNaN(char) ? charValues[char] : parseInt(char);
        sum += value * Math.pow(2, i);
    }
    let calculatedCheckDigit = sum % 11 % 10;

    // Extract the actual check digit from the container number
    let actualCheckDigit = parseInt(containerNumber.charAt(10));

    // Validate the check digit
    if (calculatedCheckDigit !== actualCheckDigit) {
        return { isValid: false, message: 'Invalid check digit' };
    }

    return { isValid: true, message: 'Valid container number' };
}

module.exports = {normalizeKeys, validateContainerNumber};