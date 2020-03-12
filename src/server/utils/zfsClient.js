
const zfs = require('zfs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports.listSnapshots = async () => {
    return new Promise((resolve, reject) => {
        zfs.list({ type: 'snapshot' }, (err, data) => {
            if (err) {
                reject(err);
                return;
            };

            resolve(data);
        });
    });
}

async function shutdownServices() {
    console.log('Stopping services');
    await exec('service mysql stop && service redis-server stop');
    console.log('Stopping services DONE');
};

async function startServices() {
    console.log('Starting services');
    await exec('service mysql start && service redis-server start');
    console.log('Starting services DONE');
};

async function restoreZFSSnapshot(name) {
    return new Promise((resolve, reject) => {
        zfs.restoreSnapshot({ dataset: name.split('@')[0], name: name.split('@')[1] }, (err, data) => {
            if (err) {
                reject(err);
                return;
            };

            resolve(data);
        });
    });
}

module.exports.restoreSnapshot = async (name) => {
    await shutdownServices();
    await restoreZFSSnapshot(name);
    await startServices();
}

module.exports.createSnapshot = async (dataset, name) => {
    return new Promise((resolve, reject) => {
        zfs.snapshot({ dataset, name }, (err, data) => {
            if (err) {
                reject(err);
                return;
            };

            resolve(data);
        });
    });
}

module.exports.removeSnapshot = async (name) => {
    return new Promise((resolve, reject) => {
        zfs.destroy({ name }, (err, data) => {
            if (err) {
                reject(err);
                return;
            };

            resolve(data);
        });
    });
}

module.exports.getStream = async (name, reference) => {
    return new Promise((resolve, reject) => {
        zfs.send({ snapshot: name, incremental: reference }, (err, data) => {
            if (err) {
                reject(err);
                return;
            };

            resolve(data);
        });
    });
}

const receiveZFSSnapshot = async (name, stream) => {
    return new Promise((resolve, reject) => {
        zfs.receive({
            dataset: name.replace('snapshot_', '').replace('.txt', ''),
            force: true
        }, (err, data) => {
            if (err) {
                reject(err);
                return;
            };
            stream.on('error', function (error) { console.log('stream', error) });
            data.on('error', function (error) { console.log('data', error) });

            stream.pipe(data);

            data.on('close', () => {
                resolve();
            });
        });
    });
}

module.exports.recieveStream = async (name, stream) => {
    await shutdownServices();
    await receiveZFSSnapshot(name, stream);
    await startServices();
}
