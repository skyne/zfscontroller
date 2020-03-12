
const zfs = require('zfs').zfs;

module.exports.listSnapshots = async () => {
    return new Promise((resolve, reject) => {
        zfs.list({ type: 'snapshot' }, (err, data) => {
            console.log(data);
            if (err) {
                reject(err);
                return;
            };

            resolve(data);
        });
    });
}