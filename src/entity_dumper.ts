import {AppController} from "./app_controller.ts";

export class EntityDump
{
  constructor()
  {
    let n = new AppController(250, this.callback.bind(this));
  }

  callback(gameInstance:any)
  {
    // Some shortcuts to update the game
    const memory  = gameInstance.memory;
    const module  = gameInstance.module;
    const offsets = gameInstance.offsets;

    let entry = memory.readPtr
      // Retrieve the entity list manager
      (module + offsets.Entity.TableBase);

    // Validate the pointer
    if (entry <= 0) return;

    entry = memory.readPtr
      // Retrieve the first entity entry
      (entry + offsets.Entity.EntryFirst);

    let entities =
    {
        npcs   : [ ],
        players: [ ],
        objects: [ ]
    };
    let repeater = { };
    let infinite = 0;

    // Read all entries from first to last
    while (entry > 0 && (entry & 1) === 0)
    {
      // Avoid repetition of entries
       if (repeater[entry]) break;
      else repeater[entry] = true;

      // Avoid possible infinite loop
      if (++infinite >= 20000) break;

      // Retrieve type and descriptor
      const type = memory.readInt32 (entry + offsets.Entity.Entry.Type       );
      const desc = memory.readPtr   (entry + offsets.Entity.Entry.Descriptors);

      if (desc > 0){
        type === 3 && entities.npcs.push
        ({
          entry,
          x: memory.readReal32 (entry + offsets.Entity.Unit.Origin + 0),
          y: memory.readReal32 (entry + offsets.Entity.Unit.Origin + 4),
          z: memory.readReal32 (entry + offsets.Entity.Unit.Origin + 8)
        });

        type === 4 && entities.players.push
        ({
          entry,
          x: memory.readReal32 (entry + offsets.Entity.Unit.Origin + 0),
          y: memory.readReal32 (entry + offsets.Entity.Unit.Origin + 4),
          z: memory.readReal32 (entry + offsets.Entity.Unit.Origin + 8)
        });

        type === 5 && entities.objects.push
        ({
          entry,
          x: memory.readReal32 (entry + offsets.Entity.Object.Origin + 0),
          y: memory.readReal32 (entry + offsets.Entity.Object.Origin + 4),
          z: memory.readReal32 (entry + offsets.Entity.Object.Origin + 8)
        });
      }

      // Read the next entry in table
      entry = memory.readPtr (entry +
          offsets.Entity.EntryNext);
    }

    for (let e in entities)
    {
      console.log (`\n${e}`);
      // Print grouped entities
      entities[e].map (entity =>
      {
        console.log (`
          entry=${entity.entry.toString (16).toUpperCase()}
          x=${entity.x.toFixed (2)}
          y=${entity.y.toFixed (2)}
          z=${entity.z.toFixed (2)}
        `);
      });
    }
  }
}
