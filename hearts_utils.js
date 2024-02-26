export class HU {
    static positions = ['north', 'east', 'south', 'west'];
    static next_passing_map = {
        right: 'left',
        left: 'across',
        across: 'none',
        none: 'right'
    };
    static passing_maps = {
        right: {
            north: 'west',
            east: 'north',
            south: 'east',
            west: 'south',
        },
        left: {
            north: 'east',
            east: 'south',
            south: 'west',
            west: 'north'
        },
        across: {
            north: 'south',
            east: 'west',
            west: 'east',
            south: 'north'
        },
        none: {
            north: 'north',
            east: 'east',
            west: 'west',
            south: 'south'
        }
    };
}
