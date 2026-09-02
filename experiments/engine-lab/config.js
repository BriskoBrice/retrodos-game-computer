window.RETRODOS_ENGINE_LAB = {
  game: {
    id: 'doom-shareware',
    title: 'DOOM Shareware',
    packageUrl: '/games/doom-shareware.zip',
    upstreamPackage: 'https://image.dosgamesarchive.com/games/doom-box.zip',
    executable: 'DOOMWEB.BAT',
    rights: 'shareware'
  },
  emulator: {
    core: 'dosbox_pure',
    pathToData: 'https://cdn.emulatorjs.org/stable/data/',
    threads: true,
    externalFiles: {
      '/emulator/c/AUTORUN.BAT': '/experiments/engine-lab/autorun.bat'
    }
  },
  virtualGamepad: [
    {
      type: 'zone',
      location: 'left',
      left: '50%',
      top: '50%',
      joystickInput: true,
      inputValues: [19, 18, 17, 16]
    },
    {
      type: 'button',
      text: 'FIRE',
      id: 'fire',
      location: 'right',
      left: 40,
      top: 45,
      bold: true,
      input_value: 0
    },
    {
      type: 'button',
      text: 'USE',
      id: 'use',
      location: 'right',
      left: 115,
      top: 95,
      bold: true,
      input_value: 1
    },
    {
      type: 'button',
      text: 'START',
      id: 'start',
      location: 'center',
      left: 20,
      fontSize: 14,
      block: true,
      input_value: 3
    }
  ]
};
