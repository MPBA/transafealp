# -*- encoding: utf-8 -*-
__author__ = 'ernesto (arbitrio@fbk.eu)'


def make_tree(pc_list, root_node):
    results = {}
    for record in pc_list:
        parent_id = record[0]
        action_id = record[1]

        if action_id in results:
            node = results[action_id]
        else:
            node = results[action_id] = {}

        node['name'] = record[2]
        node['numcode'] = record[3]
        node['description'] = record[4]
        node['duration'] = record[5]
        node['status'] = record[6]
        node['comment'] = record[7]
        if parent_id != action_id:
            if parent_id in results:
                parent = results[parent_id]
            else:
                parent = results[parent_id] = {}
            if 'children' in parent:
                parent['children'].append(node)
            else:
                parent['children'] = [node]

    # assuming we wanted node id #0 as the top of the tree
    return results[root_node]