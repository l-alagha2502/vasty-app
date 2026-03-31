const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'data.json');

const get = () => {
    if (!fs.existsSync(filePath)) return {};
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (err) {
        return {};
    }
};

const set = (data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = {
    get,
    set,
    getStore: () => ({
        read: get,
        write: set
    })
};
