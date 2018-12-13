const WAIT = 'wait';
const RACE = 'race';
const EACH = 'each';


export const COORDINATION_TYPES = {
  wait: { id: WAIT, label: 'Wait for all' },
  race: { id: RACE, label: 'Run once for first' },
  each: { id: EACH, label: 'Run for each in link' }
};

export const FLOW_CONTROL_TYPES = {
  wait: { id: WAIT, label: 'Wait for all agents and then run' },
  race: { id: RACE, label: 'Run only for first agent' },
  each: { id: EACH, label: 'Run for each agent' }
};


