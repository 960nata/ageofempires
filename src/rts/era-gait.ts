import {cyclePose} from './pose-sampling';

// The three authored walking keys are contact / passing / opposite contact.
// Equipment changes belong in the artwork. Duplicating contact frames by era
// made the feet stop while the unit continued travelling.
const WALK=[1,2,3,2] as const;
const RUN=[4,5,6,5] as const;

export function eraGait(phase:number,era:number,mounted=false,run=false,base=0,unit=''){
 const steps=mounted&&run?RUN:!mounted&&base===5?WALK.map(step=>step+5):WALK;
 return cyclePose(phase*steps.length,steps,true);
}
