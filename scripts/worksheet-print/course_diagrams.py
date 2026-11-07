"""Additional bounded physics diagrams, drawn as print-safe vector graphics."""
import math

def install(r):
    prior=r.base.draw
    def draw(s,v,x,y,w=255,h=110):
        k=v['kind'];ink=r.INK;gray=r.GRAY;grid=r.GRID
        if k=='axes_blank':
            s.arrow(x+28,y+h-25,x+w-5,y+h-25,ink,.7);s.arrow(x+28,y+h-25,x+28,y+20,ink,.7)
            s.txt(x+4,y+1,v.get('ylabel',''),7.5);s.txt(x+35,y+h-10,v.get('xlabel',''),7.5)
            for i in range(1,5):
                xx=x+28+i*(w-35)/5;s.line(xx,y+23,xx,y+h-25,grid,.25,(2,3))
                yy=y+23+i*(h-48)/5;s.line(x+28,yy,x+w-8,yy,grid,.25,(2,3))
            return
        if k=='field_force_blank':
            for i,label in enumerate(['Field / first contribution','Force / second contribution']):
                yy=y+20+i*45;s.circle(x+32,yy+12,3,ink,ink);s.txt(x+50,yy-4,label,7.5)
            s.txt(x+5,y+100,'Draw separate arrows; label quantities and units.',7.3);return
        if k=='potential_blank':
            for i,label in enumerate(['Initial / supply','Final / component']):
                xx=x+8+i*w/2;s.line(xx,y+38,xx+w/2-20,y+38,ink,.8);s.txt(xx,y+15,label,7.5)
                s.txt(xx,y+56,'V: ____ J/C',7.5)
            s.txt(x+8,y+92,'Charge: ____ C     Energy transfer: ____ J',7.5);return
        if k=='circuit_blank':
            s.txt(x+5,y+3,'Draw the complete circuit and label shared nodes.',7.5)
            s.rect(x+5,y+20,w-10,h-30,None,grid);return
        if k=='magnet_pair':
            for xx in [x+12,x+145]:
                s.rect(xx,y+40,85,28,None,ink);s.line(xx+42,y+40,xx+42,y+68,ink,.7)
            s.txt(x+5,y+5,'Label poles; add force or field arrows.',7.5);return
        if k=='wire_blank':
            s.circle(x+w/2,y+55,8,None,ink)
            if v.get('into'):
                s.line(x+w/2-4,y+51,x+w/2+4,y+59,ink,1);s.line(x+w/2+4,y+51,x+w/2-4,y+59,ink,1)
            else:s.circle(x+w/2,y+55,2,ink,ink)
            s.txt(x+5,y+5,'Cross = current into page. Add magnetic-field arrows.',7.2);return
        if k=='flux_blank':
            s.c.setStrokeColor(ink);s.c.ellipse(x+85,792-y-80,x+165,792-y-25,stroke=1,fill=0)
            s.txt(x+8,y+5,'Label field direction, loop area and what changes.',7.4)
            s.txt(x+8,y+95,'Turns: ____     Time interval: ____     emf: ____',7.4);return
        if k in ['wave_blank','superposition_blank']:
            rows=v.get('rows',3 if k=='superposition_blank' else 2);hh=(h-18)/rows
            for i in range(rows):
                yy=y+12+i*hh
                s.line(x+20,yy+hh/2,x+w-10,yy+hh/2,gray,.6,(3,3))
                s.line(x+20,yy,x+20,yy+hh-4,gray,.5)
                s.txt(x+2,yy+hh/2-5,['A','B','Sum'][i],7.3)
            s.txt(x+24,y+h-4,v.get('horizontal','Add signed displacements; label units.'),7.3);return
        if k=='boundary_blank':
            s.line(x+w/2,y+10,x+w/2,y+90,ink,1)
            s.txt(x+10,y+4,'Medium 1',8);s.txt(x+w/2+15,y+4,'Medium 2',8)
            s.txt(x+10,y+98,'Add wavefronts, direction and wavelengths.',7.5);return
        if k=='tube_blank':
            s.line(x+20,y+25,x+w-20,y+25,ink,1);s.line(x+20,y+75,x+w-20,y+75,ink,1)
            if v.get('mode')=='closed-open':s.line(x+20,y+25,x+20,y+75,ink,2)
            s.txt(x+20,y+5,v.get('mode','open-open')+' tube',8)
            s.txt(x+20,y+92,'Draw a displacement pattern; label nodes and antinodes.',7);return
        if k=='radial_blank':
            cx=x+75;cy=y+53
            for rr in [20,40]:s.circle(cx,cy,rr,None,gray)
            s.circle(cx,cy,3,ink,ink);s.txt(cx+48,cy-10,'r',8)
            s.txt(x+5,y+100,'Label distances and compare intensity.',7.5);return
        if k=='mirror_blank':
            cx=x+w/2;s.line(cx,y+8,cx,y+87,ink,2)
            s.line(x+10,y+48,x+w-10,y+48,gray,.6,(3,3))
            s.txt(cx+8,y+9,'Mirror',8);s.txt(x+10,y+97,'Add object / image or incident / reflected rays.',7.3);return
        if k=='lens_grid':
            cx=x+w*.57;cy=y+48;f=31
            s.line(x+4,cy,x+w-4,cy,gray,.6);s.line(cx,y+7,cx,y+88,ink,1.2)
            for sign in [-1,1]:
                for factor in [1,2]:
                    xx=cx+sign*factor*f;s.line(xx,cy-3,xx,cy+3,ink,.7);s.txt(xx-5,cy+7,'F' if factor==1 else '2F',7)
            ox=cx-v.get('objectF',3)*f;s.arrow(ox,cy,ox,cy-22,ink,1)
            s.txt(ox-10,cy-36,'Object',7.5)
            s.txt(x+5,y+96,('Diverging' if v.get('diverging') else 'Converging')+' thin lens; add principal rays.',7.4);return
        if k=='spectrum_blank':
            s.arrow(x+25,y+78,x+w-5,y+78,ink,.7);s.arrow(x+25,y+78,x+25,y+20,ink,.7)
            s.txt(x+5,y+2,'Relative spectral emission',7.5);s.txt(x+45,y+93,'Wavelength (label units and peaks)',7.3);return
        if k=='sightline':
            s.rect(x+5,y+40,30,25,None,ink);s.circle(x+w-30,y+52,5,None,ink)
            s.line(x+35,y+52,x+w-35,y+52,gray,.7,(3,3))
            s.txt(x+5,y+78,'Observer',8);s.txt(x+w-60,y+78,'Target',8)
            s.txt(x+5,y+5,'Add a velocity perpendicular to the line of sight.',7.5);return
        if k in ['thermal_blank','thermal_account','system_boundary','convection_blank']:
            if k=='thermal_blank':
                for i in range(2):
                    xx=x+12+i*w/2;s.rect(xx,y+25,w/2-25,45,None,ink)
                    s.txt(xx,y+8,'Sample A' if i==0 else 'Sample B',8)
                s.txt(x+12,y+88,'Label temperatures and draw energy-transfer arrows.',7.2)
            elif k=='thermal_account':
                s.rect(x+85,y+25,85,48,None,ink);s.txt(x+98,y+42,'Sample',8)
                s.txt(x+5,y+8,'Initial T / phase: ______    Final T / phase: ______',7.4)
                s.txt(x+5,y+90,'Add an energy arrow; label mass, c or L as needed.',7.2)
            elif k=='system_boundary':
                s.rect(x+78,y+25,100,50,None,ink);s.txt(x+89,y+42,'Chosen system',7.7)
                s.txt(x+5,y+5,'Draw and label all energy transfers across the boundary.',7.1)
                s.txt(x+5,y+91,'Stored energy change: __________ J',7.5)
            else:
                s.poly([(x+35,y+20),(x+35,y+78),(x+w-35,y+78),(x+w-35,y+20)],ink,1)
                s.line(x+35,y+30,x+w-35,y+30,gray,.6)
                s.txt(x+85,y+91,'Heater below pot',8)
            return
        if k=='particle_blank':
            for i in range(2):
                xx=x+5+i*w/2;s.rect(xx,y+20,w/2-12,63,None,ink)
                for dx,dy in [(18,18),(48,25),(78,16),(28,46),(68,47)]:s.circle(xx+dx,y+20+dy,2,ink,ink)
                s.txt(xx,y+4,'Sample A' if i==0 else 'Sample B',8)
            s.txt(x+5,y+94,'Add velocity arrows; use lengths to show a range of speeds.',7);return
        if k=='energy_blank':
            labels=v.get('labels',['Initial','Transfers','Final'])
            for i,label in enumerate(labels):
                xx=x+i*w/3;s.txt(xx+3,y,label,8,'DB')
                s.line(xx+3,y+78,xx+w/3-8,y+78,ink,.7)
                s.line(xx+3,y+20,xx+3,y+78,gray,.5)
                for yy in [35,50,65]:s.line(xx+3,y+yy,xx+w/3-8,y+yy,grid,.3,(2,3))
            s.txt(x+3,y+92,'Draw bars or transfer arrows; label forms and joules.',7.3);return
        if k=='energy_levels':
            s.arrow(x+32,y+90,x+32,y+10,ink,.7)
            s.line(x+32,y+20,x+w-10,y+20,gray,.7,(3,3));s.txt(x+40,y+3,'Zero reference',8)
            s.txt(x+45,y+90,'Add and label initial / final energy levels.',7.3);return
        if k=='height_blank':
            s.line(x+15,y+90,x+w-10,y+90,ink,.8);s.txt(x+20,y+95,'Choose and label a zero-height level.',7.3)
            for i,yy in enumerate([65,25]):
                xx=x+45+i*105;s.rect(xx,yy+y,35,12,None,ink)
                s.line(xx+43,yy+y,xx+43,y+90,gray,.6,(2,2))
                s.txt(xx,y+yy-13,'Initial' if i==0 else 'Final',7.5)
            return
        if k=='work_blank':
            s.rect(x+30,y+45,45,30,None,ink);s.line(x+10,y+78,x+w-10,y+78,gray,.7)
            s.txt(x+15,y+8,'Add force and displacement arrows; label the angle.',7.5)
            s.txt(x+15,y+92,'Force: ____ N       Displacement: ____ m',7.5);return
        if k=='two_paths':
            s.poly([(x+15,y+20),(x+90,y+80),(x+w-20,y+80)],ink,1)
            s.poly([(x+15,y+20),(x+95,y+28),(x+150,y+80),(x+w-20,y+80)],gray,1)
            s.txt(x+18,y+3,'Same start',8);s.txt(x+w-80,y+90,'Same finish',8)
            s.txt(x+18,y+95,'Mark the vertical height change.',7.5);return
        if k=='before_after':
            for i,label in enumerate(v.get('labels',['Before','After'])):
                xx=x+i*(w/2+5)
                s.txt(xx,y,label,8,'DB');s.line(xx,y+18,xx+w/2-15,y+18,grid,.5)
                s.line(xx,y+80,xx+w/2-15,y+80,gray,.6)
            s.txt(x,y+95,v.get('quantity','Label masses and velocities.'),7.5);return
        if k=='altitude':
            cx=x+60;cy=y+52;rr=30;obj=x+w-25
            s.circle(cx,cy,rr,None,ink);s.circle(cx,cy,2,ink,ink);s.circle(obj,cy,3,ink,ink)
            s.line(cx,cy,obj,cy,gray,.8,(3,3))
            s.line(cx,y+25,cx+rr,y+25,ink);s.txt(cx+10,y+10,'R',8)
            s.line(cx+rr,y+25,obj,y+25,ink);s.txt((cx+rr+obj)/2-3,y+10,'h',8)
            s.line(cx,y+83,obj,y+83,ink);s.txt((cx+obj)/2-4,y+88,'r',8)
            return
        if k=='timelines':
            lo,hi=v['lo'],v['hi'];px=lambda z:x+42+(z-lo)/(hi-lo)*(w-54)
            for i,pts in enumerate(v['points']):
                yy=y+28+i*40;s.txt(x,yy-5,v['labels'][i],7.5)
                s.arrow(px(lo),yy,px(hi),yy,gray,.6)
                for z in pts:s.circle(px(z),yy,2.5,ink,ink);s.txt(px(z)-5,yy-15,str(z),7)
                for j in range(5):
                    z=lo+(hi-lo)*j/4;xx=px(z);s.line(xx,yy-2,xx,yy+2,gray,.5);s.txt(xx-4,yy+5,f'{z:g}',6.5)
            s.txt(x+42,y+95,v.get('unit','Time'),7.5);return
        if k=='motion_blank':
            s.txt(x,y,v.get('label','Motion model'),8,'DB')
            s.arrow(x+20,y+27,x+w-10,y+27,gray,.7)
            s.txt(x+20,y+12,v.get('direction','Right is positive.'),7.5)
            s.txt(x,y+49,'Velocity:',8);s.txt(x,y+79,'Acceleration / force:',8)
            return
        if k=='test_track':
            s.rect(x+15,y+30,w-30,45,None,ink)
            s.line(x+35,y+30,x+35,y+75,ink,1);s.line(x+w-35,y+30,x+w-35,y+75,ink,1)
            s.txt(x+16,y+10,'Start',8);s.txt(x+w-55,y+10,'Finish',8)
            s.txt(x+20,y+91,'Distance: ____     Timing method: __________',7.5);return
        if k=='wheel_blank':
            s.circle(x+75,y+52,30,None,ink);s.line(x+75,y+52,x+105,y+52,gray,.7)
            s.line(x+20,y+84,x+w-10,y+84,ink,.7)
            s.txt(x+120,y+32,'Radius / diameter: ____',7.5);s.txt(x+120,y+52,'Turns per second: ____',7.5)
            s.txt(x+20,y+96,'Travel per turn: ____     Ground speed: ____',7.4);return
        if k=='gear_wheel':
            for xx,rr,lab in [(x+38,17,'Driver'),(x+92,35,'Driven'),(x+205,28,'Wheel')]:
                s.circle(xx,y+53,rr,None,ink);s.circle(xx,y+53,2,ink,ink);s.txt(xx-18,y+7,lab,7.5)
            s.line(x+92,y+53,x+177,y+53,gray,.7,(3,3));s.txt(x+120,y+36,'Same axle',7)
            s.txt(x+5,y+97,'Label teeth, rotation rates and wheel size.',7.5);return
        if k=='cart_hanger':
            floor=y+55;pulley=x+w-43
            s.line(x+10,floor,pulley-6,floor,ink,1)
            s.rect(x+30,y+24,64,22,None,ink)
            for xx in [x+43,x+80]:s.circle(xx,y+50,5,None,ink)
            s.circle(pulley,y+34,8,None,ink)
            s.line(x+94,y+26,pulley,y+26,ink,.8)
            s.line(pulley+8,y+34,pulley+8,y+66,ink,.8)
            s.rect(pulley-4,y+66,24,26,None,ink)
            s.txt(x+32,y+7,'Cart',8);s.txt(x+103,y+9,'String',7.5)
            s.txt(x+27,y+70,'Mass on cart',7.5)
            s.txt(pulley-22,y+97,'Hanging mass',7.5)
            return
        if k=='suspension':
            cx=x+w/2;cy=y+72;angle=math.radians(v.get('angle',45));L=64
            s.rect(cx-26,cy,52,22,None,ink)
            for sign,label in [(-1,v.get('leftLabel','T₁')),(1,v.get('rightLabel','T₂'))]:
                startx=cx+sign*18
                endx=startx+sign*L*math.cos(angle);endy=cy-L*math.sin(angle)
                s.line(startx,cy,endx,endy,ink,1.2)
                s.line(endx-12,endy,endx+12,endy,gray,1)
                s.txt(endx-15,endy-14,label,7.5)
            s.txt(cx-24,cy+6,v.get('label','Object'),7.5)
            if v.get('angleLabel'):s.txt(x+3,y+4,v['angleLabel'],7.5)
            if v.get('weight'):s.txt(cx-27,y+98,v['weight'],7.5)
            return
        if k=='graph' and v.get('scatter'):
            prior(s,{**v,'points':[]},x,y,w,h)
            left,right,top,bottom=x+36,x+w-8,y+19,y+h-26
            for a,b in v['points']:
                xx=left+(a-v.get('xmin',0))/(v['xmax']-v.get('xmin',0))*(right-left)
                yy=bottom-(b-v.get('ymin',0))/(v['ymax']-v.get('ymin',0))*(bottom-top)
                s.circle(xx,yy,2.5,ink,ink)
            return
        prior(s,v,x,y,w,h)
    r.base.draw=draw
