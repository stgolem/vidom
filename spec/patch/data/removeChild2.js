import createNode from '../../../src/createNode';
import patchOps from '../../../src/client/patchOps';

const oldNode = createNode('div');

export default {
    'name' : 'removeChild2',
    'trees' : [
        createNode('fragment').children([
            createNode('div'),
            createNode('div'),
            oldNode
        ]),
        createNode('fragment').children([
            createNode('div'),
            createNode('div')
        ])
    ],
    'patch' : [
        { op : patchOps.removeChild, args : [oldNode] }
    ]
}
