const { exec } = require('child_process');
const { cmdOutputCallback, ACTIONS } = require('./common');

/* -- Configuration -- */
const DB_SA_PASSWORD = process.env.DX_METRICS_LOCAL_DB_PASSWORD;
const DB_PORT = 1433;
const DB_CONTAINER_NAME = 'dx_metrics_mssql';
const DB_IMAGE = 'mcr.microsoft.com/mssql/server:2022-latest';
const VOLUME_NAME = 'dx_metrics_db_volume';

/* -- Commands -- */
const CMD_CREATE_VOLUME = `docker volume create ${VOLUME_NAME}`;
const CMD_PULL_IMAGE = `docker pull ${DB_IMAGE}`;
const CMD_RUN_DB_CONTAINER = `docker run \
--platform linux/amd64 \
-e "ACCEPT_EULA=Y" \
-e "MSSQL_SA_PASSWORD=${DB_SA_PASSWORD}" \
-p ${DB_PORT}:${DB_PORT} \
--rm \
-d \
--mount source=${VOLUME_NAME},target=/var/opt/mssql/data \
--name ${DB_CONTAINER_NAME} \
--user root \
${DB_IMAGE}`;
const CMD_STOP_DB_CONTAINER = `docker stop ${DB_CONTAINER_NAME}`;

/* -- Utils -- */
const getCommandToExecute = (action) => {
  switch (action) {
    case ACTIONS.createVolume:
      console.log(`Creating volume ${VOLUME_NAME}...`);
      return CMD_CREATE_VOLUME;
    case ACTIONS.pullImage:
      console.log(`Pulling image ${DB_IMAGE}...`);
      return CMD_PULL_IMAGE;
    case ACTIONS.runContainer:
      console.log('Starting db container...');
      return CMD_RUN_DB_CONTAINER;
    case ACTIONS.stopContainer:
      console.log('Stopping db container...');
      return CMD_STOP_DB_CONTAINER;
    default:
      throw Error(`unknown command: ${action}`);
  }
};

/* -- Main -- */
const cmd = process.argv[2];
const dockerCmd = getCommandToExecute(cmd);
exec(dockerCmd, cmdOutputCallback);
