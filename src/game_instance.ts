const Robot   = require ("robot-js" );
const Offsets = require ("./offsets.ts");
const Process = Robot.Process;
const Module  = Robot.Module;
const Memory  = Robot.Memory;
const Window  = Robot.Window;

export class GameInstance
{
  private _window: any;
  private _process: any;
  private _is64bit: boolean;
  private _memory: any;
  private _module: any;
  private _offsets: any;

  constructor()
  {
    this.deselect();
  }

  deselect()
  {
      this._window  = null;       // The game window
      this._process = null;       // The game process
      this._is64Bit = false;      // If game is 64Bit

      this._memory  = null;       // The game memory
      this._module  = null;       // Main module addr

      this._offsets = null;       // Correct offsets
  }

  selectByProcess (process)
  {
    // Check if arguments are correct
    if (!(process instanceof Process))
        throw new TypeError ("Invalid arguments");

    // Attempt to select the main window
    let window = process.getWindows()[0];

    return window &&
        // Perform window selection
        this.selectByWindow (window);
  }

  selectByWindow (window)
  {
    // Check if arguments are correct
    if (!(window instanceof Window))
        throw new TypeError ("Invalid arguments");

    // Check if the window title correctly matches
    console.log(window.getTitle());
    if (window.getTitle() !== "World of Warcraft")
        return false;

    let process = window.getProcess();
    // Ensure that the process was opened
    if (!process.isValid())
    {
      console.log("Found process but can't access it. Try running as admin.");
      return false;
    }

    let module =
        // Get the main executable module
        process.getModules (".*\.exe")[0];
    if (!module) return false;
    module = module.getBase();

    // Determine if game is 64Bit
    let is64Bit = process.is64Bit();
    let offsets = is64Bit ?
        // Make sure to select correct offsets
        Offsets.Offsets64 : Offsets.Offsets32;

    // Create a new memory object
    let memory = Memory (process);
    if (memory.readString
        // Ensure game build is supported
        (module + offsets.GameBuild, 6) !==
        Offsets.GameBuild) return false;

    this._window  = window;
    this._process = process;
    this._is64Bit = is64Bit;
    this._memory  = memory;
    this._module  = module;
    this._offsets = offsets;

    // Create the memory cache
    // y dis size doe?
    this._memory.createCache
        (16384, 4096, 10485760);

    return true;
  }

  selectByFindProcess()
  {
    for (let p of Process.getList ("Wow.*\.exe")) {
      // Select the first suitable process value
      if (this.selectByProcess (p)) return true;
    }

    return false;
  }

  selectByFindWindow()
  {
    for (let w of Window.getList ("World of Warcraft"))
    {
      // Select the first suitable window value
      if (this.selectByWindow (w)) return true;
    }

    return false;
  }

  selectByActiveWindow()
  {
    // Attempt to select the current active window
    return this.selectByWindow (Window.getActive());
  }

  isSelected()
  {
    return this._window !== null;
  }

  isRunning()
  {
    // Ensure a game window is selected
    if (!this.isSelected()) return false;

    return !this._process.hasExited() &&
            this._window .isValid  ();
  }

  get window () { return this._window;  }

  get process() { return this._process; }
  get is64Bit() { return this._is64Bit; }

  get memory () { return this._memory;  }
  get module () { return this._module;  }

  get offsets() { return this._offsets; }
}
