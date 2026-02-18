import type { MapManager } from "../three/mapManager";
import type { Tile } from "../three/tile";

export class CrewPlayer {
	public mapManager: MapManager;
	private position: Position;
	private life_points: number;

	constructor(position: Position, mapManager: MapManager) {
		this.position = position;
		this.life_points = 3;
		this.mapManager = mapManager;
	}

	public function moveBoat(to: Position) {
		
		const nextTile: Tile;
		// this.mapManager.getTile()
		
		if (nextTile.state === 'monster') {
			if ()
		}
	}


}
