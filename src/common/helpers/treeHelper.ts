import { cloneDeep } from 'lodash';
import { ObjectId } from 'mongodb';
import { ITreeNode } from '../interfaces';

/*
function to build a tree
input: subGroup: group information, level
output
tree {
    _id: string,
    name: string,
    level: number,
    children: [...]
}
*/

export function buildATree(
    node: ITreeNode,
    level: number,
    treeList: ITreeNode[],
) {
    const currentTree = {
        _id: node._id,
        value: node.value,
        children: [],
        data: node?.data,
        label: node.label,
        level: node.level,
    };
    // find children
    const listSubTree = treeList.filter(
        (tree) => tree.parentId?.toString() === currentTree._id?.toString(),
    );

    const parent = treeList.find(
        (tree) => tree._id?.toString() === node.parentId?.toString(),
    );

    if (parent) {
        node.parentIds = [...(parent?.parentIds || []), parent._id];
    } else {
        node.parentIds = [];
    }

    for (let i = 0; i < listSubTree.length; i++) {
        // find all children contains

        const subNode = cloneDeep(
            buildATree(listSubTree[i], level + 1, treeList),
        );
        currentTree.children.push(subNode);
    }
    return { ...currentTree, parentIds: node.parentIds };
}

/*
function to build group of tree
output
[{
    _id: string,
    name: string,
    level: number,
    children: [...]
}]
*/
export function buildTreeGroups(treeList: ITreeNode[]) {
    // Find all root
    const firstLevelGroup = treeList.filter((tree) => !tree.parentId);

    const trees = [];
    for (let i = 0; i < firstLevelGroup.length; i++) {
        // build tree from level 2
        const tree = buildATree(firstLevelGroup[i], 2, treeList);
        trees.push(tree);
    }
    return trees;
}

export function searchTree(_id: ObjectId, tree: ITreeNode) {
    if (tree._id.toString() === _id.toString()) {
        return tree;
    } else if (tree.children?.length) {
        for (let i = 0; i < tree.children?.length; i++) {
            if (searchTree(_id, tree.children[i])?._id?.toString()?.length) {
                return searchTree(_id, tree.children[i]);
            }
        }
    }
    return null;
}

export function searchTrees(_id: ObjectId, treeList: ITreeNode[]) {
    for (let i = 0; i < treeList?.length; i++) {
        if (searchTree(_id, treeList[i])?._id?.toString()?.length) {
            return searchTree(_id, treeList[i]);
        }
    }
    return null;
}
