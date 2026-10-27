"""Blender 4.3: original rounded arrow, soft morphs and transparent posters."""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/landing/soft-arrow'
SOURCE = ROOT / 'design/soft-arrow-20261027'
ASSETS.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Rounded outline, then a closed, inflated cross-section rather than a flat face.
corners = [(-.94,-.19),(.01,-.19),(.01,-.64),(.96,0),(.01,.64),(.01,.19),(-.94,.19)]
outline=[]
for i, p in enumerate(corners):
    previous=Vector(corners[(i-1)%len(corners)])
    current=Vector(p)
    following=Vector(corners[(i+1)%len(corners)])
    a=current+(previous-current).normalized()*min(.13,(previous-current).length*.28)
    b=current+(following-current).normalized()*min(.13,(following-current).length*.28)
    for j in range(9):
        t=j/8
        q=(1-t)**2*a+2*(1-t)*t*current+t*t*b
        outline.append(q)

curve=bpy.data.curves.new('Soft arrow outline','CURVE')
curve.dimensions='2D'
curve.resolution_u=12
curve.fill_mode='BOTH'
curve.extrude=.075
curve.bevel_depth=.105
curve.bevel_resolution=6
spline=curve.splines.new('POLY')
spline.points.add(len(outline)-1)
for point,p in zip(spline.points,outline):point.co=(p.x,p.y,0,1)
spline.use_cyclic_u=True
arrow=bpy.data.objects.new('LeiBox soft arrow',curve)
bpy.context.collection.objects.link(arrow)
bpy.context.view_layer.objects.active=arrow
arrow.select_set(True)
bpy.ops.object.convert(target='MESH')

# A small voxel pass welds the concave junctions into one smooth soft body.
remesh=arrow.modifiers.new('Continuous inflated surface','REMESH')
remesh.mode='VOXEL'
remesh.voxel_size=.026
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=arrow.modifiers.new('Soft contour','SMOOTH')
smooth.factor=.68
smooth.iterations=5
bpy.ops.object.modifier_apply(modifier=smooth.name)
sub=arrow.modifiers.new('Polished curvature','SUBSURF')
sub.levels=1
bpy.ops.object.modifier_apply(modifier=sub.name)
decimate=arrow.modifiers.new('Icon-scale topology','DECIMATE')
decimate.ratio=.10
bpy.ops.object.modifier_apply(modifier=decimate.name)
for polygon in arrow.data.polygons:polygon.use_smooth=True

# Give the broad faces a pillow profile; a bevel alone leaves an embossed flat icon.
for vertex in arrow.data.vertices:
    x,y,z=vertex.co
    p=Vector((x,y))
    inside=False
    distance=10
    for i,point in enumerate(corners):
        a=Vector(point)
        b=Vector(corners[(i+1)%len(corners)])
        edge=b-a
        t=max(0,min(1,(p-a).dot(edge)/edge.length_squared))
        distance=min(distance,(p-(a+t*edge)).length)
        if (a.y>y)!=(b.y>y) and x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x:
            inside=not inside
    if inside:
        amount=min(1,distance/.32)
        dome=.16*amount*amount*(3-2*amount)
        vertex.co.z+=dome if z>0 else -dome
arrow.data.update()

# Author in Blender X/Z so the exported glTF has its face on Three's X/Y.
for vertex in arrow.data.vertices:
    x,y,z=vertex.co
    vertex.co=(x,-z,y)
arrow.shape_key_add(name='Basis')
tip=arrow.shape_key_add(name='Tip flex')
tail=arrow.shape_key_add(name='Tail follow')
for vertex, a, b in zip(arrow.data.vertices,tip.data,tail.data):
    x,y,z=vertex.co
    head=max(0,min(1,(x+.2)/1.25))**2
    end=max(0,min(1,(-x+.1)/1.2))**2
    a.co.y+=.25*head
    a.co.z+=.045*head*(1-abs(z))
    a.co.x-=.045*head
    b.co.y-=.17*end
    b.co.z-=.035*end
tip.slider_min=-1
tail.slider_min=-1

material=bpy.data.materials.new('Glazed silver · adaptive black in dark theme')
material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value=(.68,.72,.79,1)
bsdf.inputs['Metallic'].default_value=.72
bsdf.inputs['Roughness'].default_value=.20
bsdf.inputs['Coat Weight'].default_value=.75
bsdf.inputs['Coat Roughness'].default_value=.13
arrow.data.materials.append(material)
arrow['Design reference']='https://x.com/heyzsolt/status/2104633548443656203/video/1'
arrow['Design note']='Original right-arrow mesh. Reference informs glossy soft motion only.'
arrow['Animation']='Tip flex and Tail follow are signed morph targets; do not replace with 2D rotation.'

bpy.ops.export_scene.gltf(filepath=str(ASSETS/'soft-arrow.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_extras=True)

scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.resolution_x=256
scene.render.resolution_y=256
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.world.color=(.32,.32,.32)
scene.view_settings.view_transform='AgX'

def area(name,location,power,size,shape='DISK',size_y=None):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.shape=shape
    data.size=size
    if size_y is not None:data.size_y=size_y
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location=location
    obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()

area('Long softbox',(-2.5,-3.5,4),460,3,'RECTANGLE',1)
area('Narrow rim',(3,-2,1),350,2.4,'RECTANGLE',.45)
area('Back softbox',(-2,2,2),550,3)
area('Front fill',(0,-5,-1),65,3)
camera_data=bpy.data.cameras.new('Icon camera')
camera=bpy.data.objects.new('Icon camera',camera_data)
bpy.context.collection.objects.link(camera)
camera.location=(0,-6,0)
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO'
camera_data.ortho_scale=2.60
scene.camera=camera
arrow.rotation_euler.z=-.24
arrow.rotation_euler.y=.025
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'soft-arrow.blend'))
scene.render.filepath=str(ASSETS/'silver.png')
bpy.ops.render.render(write_still=True)
bsdf.inputs['Base Color'].default_value=(.008,.01,.014,1)
bsdf.inputs['Metallic'].default_value=.22
bsdf.inputs['Roughness'].default_value=.18
scene.render.filepath=str(ASSETS/'black.png')
bpy.ops.render.render(write_still=True)
print({'vertices':len(arrow.data.vertices),'polygons':len(arrow.data.polygons),'glb':str(ASSETS/'soft-arrow.glb')})
