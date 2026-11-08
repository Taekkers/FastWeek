import random, json, math, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
random.seed(7); np.random.seed(7)
FONTS={'serif':'/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf','sans':None,'cal':None,'free':None}
import subprocess
def findfont(name):
    out=subprocess.run(['fc-match','-f','%{file}',name],capture_output=True,text=True).stdout
    return out
FONTS={'serif':findfont('DejaVu Serif'),'carlito':findfont('Carlito'),'caladea':findfont('Caladea'),'freesans':findfont('FreeSans')}
print(FONTS)
RECIPES=[
 ('Kylling i karry med ris',4,35,['400 g kyllingebryst','2 løg','3 fed hvidløg','2 spsk. karry','1 dåse kokosmælk (400 ml)','2 dl ris','1 dl mælk','1 spsk. olie','1 tsk. salt','½ dl hakket persille','friske krydderurter','3 gulerødder']),
 ('Chili con carne',4,45,['500 g hakket oksekød','1 løg','2 fed hvidløg','1 dåse hakkede tomater','1 dåse kidneybønner','2 spsk. tomatpuré','1 tsk. spidskommen','1½ dl vand','1 rød peberfrugt','olie til stegning','200 g majs','1/2 tsk. chiliflager']),
 ('Pasta med spinat og feta',2,20,['250 g pasta','200 g frisk spinat','100 g feta','2 fed hvidløg','1 citron','3 spsk. olivenolie','50 g pinjekerner','2 dl fløde','1 knivspids muskatnød','parmesan til servering']),
 ('Ovnbagt laks med kartofler',4,40,['600 g laksfilet','800 g kartofler','1 citron','1 bundt dild','2 spsk. smør','200 g cremefraiche','1 squash','2 tsk. sennep','1 spsk. honning','salt og peber']),
 ('Boller i karry',4,40,['500 g hakket svinekød','1 løg','1 æg','1 dl mælk','2 spsk. karry','1 æble','2 dl ris','1 spsk. mel','3 dl bouillon','1 dl piskefløde','1 banan']),
 ('Grøntsagssuppe med brød',4,30,['2 gulerødder','1 porre','300 g blomkål','1 selleri','1 l hønsebouillon','1 dl fløde','2 fed hvidløg','1 spsk. smør','½ bdt. persille','4 skiver rugbrød']),
]
METHOD=("Hak løget og hvidløget fint. Varm olien op i en gryde og steg løget i 3 minutter, til det er blødt. Tilsæt kødet og brun det godt på alle sider. "
 "Rør krydderierne i og lad det simre under låg i 20 minutter. Smag til med salt og peber. Server med friske urter og et skvæt citronsaft. "
 "Skær grøntsagerne i mindre tern og kom dem i gryden sammen med bouillonen. Lad retten koge op og simre ved svag varme, til det hele er mørt. ").split('. ')
def page(rec,font,size_pt,idx):
    title,pers,mins,ings=rec
    W,H=2480,3508
    img=Image.new('RGB',(W,H),(246,243,235))
    d=ImageDraw.Draw(img)
    f=lambda pt,bold=False:ImageFont.truetype(FONTS[font],int(pt*300/72))
    ft,fh,fb=f(size_pt+9),f(size_pt+2),f(size_pt)
    d.text((170,200),title.upper() if idx%2 else title,font=ft,fill=(30,30,30))
    d.text((170,330),f'Til {pers} personer · {mins} min.',font=fh,fill=(80,80,80))
    # ingredient panel (tinted)
    px0,py0,px1=150,480,1060
    lines=[]
    y=py0+40
    d.text((px0+30,y),'Ingredienser',font=fh,fill=(20,20,20));y+=int(size_pt*300/72*1.9)
    lh=int(size_pt*300/72*1.35)
    maxw=px1-px0-60
    for s in ings:
        # wrap long lines
        words=s.split(' ');cur=''
        parts=[]
        for w in words:
            t=(cur+' '+w).strip()
            if d.textlength(t,font=fb)>maxw:
                parts.append(cur);cur=w
            else:cur=t
        parts.append(cur)
        for p in parts:
            d.text((px0+30,y),p,font=fb,fill=(25,25,25));y+=lh
        lines.append(s)
    py1=y+30
    panel=Image.new('RGB',(px1-px0,py1-py0),(228,236,226))
    # draw panel under text: re-render text over panel
    img.paste(panel,(px0,py0))
    d=ImageDraw.Draw(img)
    y=py0+40
    d.text((px0+30,y),'Ingredienser',font=fh,fill=(20,20,20));y+=int(size_pt*300/72*1.9)
    for s in ings:
        words=s.split(' ');cur='';parts=[]
        for w in words:
            t=(cur+' '+w).strip()
            if d.textlength(t,font=fb)>maxw:parts.append(cur);cur=w
            else:cur=t
        parts.append(cur)
        for p in parts:
            d.text((px0+30,y),p,font=fb,fill=(25,25,25));y+=lh
    # method column
    x=1160;y=py0+40
    d.text((x,y),'Fremgangsmåde',font=fh,fill=(20,20,20));y+=int(size_pt*300/72*1.9)
    mw=W-x-170
    for k,para in enumerate(METHOD*2):
        t=f'{k+1}. '+para.strip()+'.'
        words=t.split(' ');cur=''
        for w in words:
            tt=(cur+' '+w).strip()
            if d.textlength(tt,font=fb)>mw:
                d.text((x,y),cur,font=fb,fill=(25,25,25));y+=lh;cur=w
            else:cur=tt
        if cur:d.text((x,y),cur,font=fb,fill=(25,25,25));y+=lh
        y+=int(lh*.4)
        if y>H-300:break
    d.text((W-300,H-170),str(40+idx*7),font=fh,fill=(60,60,60))
    return img,title,ings
def photograph(img,rng,fill=0.85,rot=2.5,persp=0.04,blur=1.0,noise=6,shadow=0.35,jpeg=72,out=(3024,4032)):
    a=np.array(img)[:,:,::-1]
    H,W=a.shape[:2]
    OW,OH=out
    # bg table
    bg=np.full((OH,OW,3),(70,85,100),np.uint8)
    scale=fill*OW/W
    pw,ph=int(W*scale),int(H*scale)
    ox,oy=(OW-pw)//2,(OH-ph)//2
    src=np.float32([[0,0],[W,0],[W,H],[0,H]])
    j=lambda:rng.uniform(-persp,persp)
    dst=np.float32([[ox+j()*pw,oy+j()*ph],[ox+pw+j()*pw,oy+j()*ph],[ox+pw+j()*pw,oy+ph+j()*ph],[ox+j()*pw,oy+ph+j()*ph]])
    M=cv2.getPerspectiveTransform(src,dst)
    R=cv2.getRotationMatrix2D((OW/2,OH/2),rot,1.0)
    warped=cv2.warpPerspective(a,M,(OW,OH),borderMode=cv2.BORDER_CONSTANT,borderValue=(70,85,100))
    warped=cv2.warpAffine(warped,R,(OW,OH),borderValue=(70,85,100))
    # lighting: gradient + soft shadow band
    yy,xx=np.mgrid[0:OH,0:OW].astype(np.float32)
    light=1.0-shadow*(xx/OW)*0.9-0.12*((yy/OH-0.5)**2)*4
    band=np.exp(-((xx-OW*rng.uniform(0.2,0.5))/ (OW*0.12))**2)*shadow*0.8*(1.0 if rng.random()<0.5 else 0.0)
    light=np.clip(light-band,0.35,1.0)
    out_img=warped.astype(np.float32)*light[:,:,None]
    out_img=cv2.GaussianBlur(out_img,(0,0),blur)
    out_img+=np.random.normal(0,noise,out_img.shape)
    out_img=np.clip(out_img,0,255).astype(np.uint8)
    return out_img
