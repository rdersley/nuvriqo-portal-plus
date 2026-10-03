import assert from 'node:assert/strict';
import test from 'node:test';
import { primarySla, slaState } from '../src/sla.js';

const cycle = (breached) => ({ breached, goalDuration: { friendly: '8h' }, remainingTime: { friendly: '2h' } });

test('reads running, paused, breached and met SLA states', () => {
  assert.equal(slaState({ name: 'Time to resolution', ongoingCycle: cycle(false), completedCycles: [] }).state, 'running');
  assert.equal(slaState({ name: 'X', ongoingCycle: { ...cycle(false), paused: true } }).state, 'paused');
  assert.equal(slaState({ name: 'X', ongoingCycle: cycle(true) }).state, 'breached');
  assert.equal(slaState({ name: 'X', completedCycles: [cycle(true), cycle(false)] }).state, 'met', 'latest completed cycle wins');
  assert.equal(slaState({ name: 'X', completedCycles: [] }), null, 'no cycles yet');
  assert.equal(slaState('Open'), null);
  assert.equal(slaState({ value: 'Large' }), null);
});

test('primary SLA prefers Time to resolution', () => {
  const fields = {
    summary: 'x',
    customfield_1: { name: 'Time to first response', completedCycles: [cycle(false)] },
    customfield_2: { name: 'Time to resolution', ongoingCycle: cycle(true) }
  };
  assert.deepEqual(primarySla(fields), { name: 'Time to resolution', state: 'breached', remaining: '2h', target: '8h' });
  assert.equal(primarySla({ summary: 'x' }), null);
});
