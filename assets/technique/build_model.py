"""Prepare the MIT desk-break mannequin for PEACH; run with /usr/local/bin/3dpy."""
import bpy, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE = os.environ.get('DESK_BREAK_MANNEQUIN', os.path.join(ROOT, '..', '..', 'desk-break', 'library', 'mannequin.blend'))
OUT = os.path.join(ROOT, 'assets', 'technique', 'peach-mannequin.glb')
bpy.ops.wm.open_mainfile(filepath=SOURCE)
body = bpy.data.objects['mannequin']
colors = {
    'wood': ((0.83, 0.74, 0.66, 1), 0.3, 0.04),
    'wood_joint': ((0.055, 0.047, 0.052, 1), 0.26, 0.18),
    'plastic': ((0.055, 0.047, 0.052, 1), 0.3, 0.1),
}
for mat in body.data.materials:
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    for link in list(mat.node_tree.links):
        mat.node_tree.links.remove(link)
    color, roughness, metallic = colors.get(mat.name, colors['wood'])
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
for p in body.data.polygons:
    p.use_smooth = True
# The source computer-mouse prop is not part of PEACH and remains zero-scaled.
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.data.objects['rig'].select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB', use_selection=True,
    export_animations=False, export_materials='EXPORT', export_yup=True,
    export_texcoords=False, export_normals=True, export_tangents=False,
)
print('PEACH_MODEL', OUT, os.path.getsize(OUT))