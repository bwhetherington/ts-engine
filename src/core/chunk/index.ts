import {VectorLike} from 'core/geometry';
import {Player} from 'core/player';

export interface ChunkLoadEvent {
  chunks: VectorLike[];
  player?: Player;
}

export interface ChunkUnloadEvent {
  chunks: VectorLike[];
  player?: Player;
}
