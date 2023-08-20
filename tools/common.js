const ACTIONS = {
  pullImage: 'pull-image',
  createVolume: 'create-volume',
  runContainer: 'run-container',
  stopContainer: 'stop-container',
};

const cmdOutputCallback = (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
};

module.exports = {
  ACTIONS,
  cmdOutputCallback,
};
