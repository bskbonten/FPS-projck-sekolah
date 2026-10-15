export type ObjectiveId = 
  | 'obj_infiltrate'
  | 'obj_neutralize_patrol'
  | 'obj_hack_terminal'
  | 'obj_survive_assault'
  | 'obj_extract';

export type ObjectiveStatus = 'locked' | 'active' | 'completed' | 'failed';

export interface MissionObjective {
  id: ObjectiveId;
  title: string;
  description: string;
  status: ObjectiveStatus;
  progress?: number;
  total?: number;
  markerPosition?: { x: number; y: number; z: number };
}

export interface MissionBriefing {
  id: string;
  codeName: string;
  location: string;
  time: string;
  situation: string;
  directives: string[];
}
