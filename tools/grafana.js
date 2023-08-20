const { exec } = require('child_process');
const { cmdOutputCallback, ACTIONS } = require('./common');

/* -- Configuration -- */
const GRAFANA_PORT = 3000;
const GRAFANA_CONTAINER_NAME = 'dx_metrics_grafana';
const GRAFANA_IMAGE = 'grafana/grafana-oss';
const VOLUME_NAME = 'dx_metrics_grafana_volume';

/* -- Commands -- */
const CMD_CREATE_VOLUME = `docker volume create ${VOLUME_NAME}`;
const CMD_PULL_IMAGE = `docker pull ${GRAFANA_IMAGE}`;
const CMD_RUN_DB_CONTAINER = `docker run \
-p ${GRAFANA_PORT}:${GRAFANA_PORT} \
--rm \
-d \
--mount source=${VOLUME_NAME},target=/var/lib/grafana \
--name ${GRAFANA_CONTAINER_NAME} \
--user root \
${GRAFANA_IMAGE}`;
const CMD_STOP_DB_CONTAINER = `docker stop ${GRAFANA_CONTAINER_NAME}`;

/* -- Utils -- */
const getCommandToExecute = (action) => {
  switch (action) {
    case ACTIONS.createVolume:
      console.log(`Creating volume ${VOLUME_NAME}...`);
      return CMD_CREATE_VOLUME;
    case ACTIONS.pullImage:
      console.log(`Pulling image ${GRAFANA_IMAGE}...`);
      return CMD_PULL_IMAGE;
    case ACTIONS.runContainer:
      console.log('Starting grafana container...');
      return CMD_RUN_DB_CONTAINER;
    case ACTIONS.stopContainer:
      console.log('Stopping grafana container...');
      return CMD_STOP_DB_CONTAINER;
    default:
      throw Error(`unknown command: ${action}`);
  }
};

/* -- Main -- */
const cmd = process.argv[2];
const dockerCmd = getCommandToExecute(cmd);
exec(dockerCmd, cmdOutputCallback);
