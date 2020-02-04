import {GameInstance} from "./game_instance.ts";

export class AppController
{
    private _updateRate: any;
    private _updateFunc: any;
    private _gameInstance: GameInstace;

    constructor (updateRate, updateFunc)
    {
      this._updateRate = updateRate;
      this._updateFunc = updateFunc;

      this._gameInstance = new GameInstance();
      console.log ("Select a WoW Window...");
      this.heartbeat();
    }

    private eventLoop()
    {
      // Waits for a game to get selected
      if (!this._gameInstance.isSelected())
      {
        this._gameInstance.selectByActiveWindow();
        return;
      }

      // Ensures the game is still running
      if (!this._gameInstance.isRunning())
      {
        console.log ("Select a WoW Window...");
        this._gameInstance.deselect(); return;
      }

      // Checks whether the player is in-game
      if (!this._gameInstance.memory.readBool
          (this._gameInstance.offsets.GameState +
           this._gameInstance.module)) return;

      // Call the specified update function
      this._updateFunc (this._gameInstance);

      // Don't forget to reset memory cache
      this._gameInstance.memory.clearCache();
    }

    private heartbeat()
    {
      this.eventLoop();
      setTimeout(this.heartbeat.bind(this), this._updateRate);
    }
 }
