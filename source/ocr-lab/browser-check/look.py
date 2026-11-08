# A page in the same style as the user's cookbook (own recipe text): thin spaced caps title, bold italic ingredients left, rule, method right.
import cv2,numpy as np,random
from PIL import Image,ImageDraw,ImageFont
F=lambda f,s:ImageFont.truetype(f,s)
BI='/usr/share/fonts/truetype/crosextra/Carlito-BoldItalic.ttf';RG='/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf';IT='/usr/share/fonts/truetype/crosextra/Carlito-Italic.ttf'
W,H=2480,3300
im=Image.new('RGB',(W,H),(244,242,238));d=ImageDraw.Draw(im)
def spaced(x,y,t,f,sp,fill=(40,40,40)):
    for ch in t:d.text((x,y),ch,font=f,fill=fill);x+=d.textlength(ch,font=f)+sp
    return x
title='KYLLINGESALAT MED BULGUR';ft=F(RG,96);tw=sum(d.textlength(c,font=ft)+14 for c in title)
spaced((W-tw)/2,420,title,ft,14)
d.text((900,600),'X  4 PERS.   I   30 MIN.   I   45 MIN.',font=F(RG,44),fill=(60,60,60))
d.text((430,720),'Frisk og mættende salat, der er nem at have med på arbejde eller servere til grill om sommeren.',font=F(IT,44),fill=(50,50,50))
fh=F(RG,44);fb=F(BI,52)
spaced(380,1050,'INGREDIENSER',fh,6)
ing=['300 g kyllingebryst','200 g bulgur','1 agurk, i tern','250 g cherrytomater, i halve','1 rødløg, i både','100 g fetaost','50 g græskarkerner','1 dåse kikærter','½ bundt mynte, hakket']
y=1130
for t in ing:d.text((370,y),t,font=fb,fill=(25,25,25));y+=72
y+=60;spaced(350,y,'DRESSING MED CITRON-',fh,6);y+=72;spaced(350,y,'TIMIAN',fh,6);y+=80
for t in ['½ dl olivenolie','½ øko citron, saft og skal','1 tsk honning','1 fed hvidløg, presset','1 håndfuld timian, hakket','salt og friskkværnet peber']:d.text((340,y),t,font=fb,fill=(25,25,25));y+=72
d.line((1180,1060,1170,y),fill=(30,30,30),width=3)
spaced(1260,1060,'FREMGANGSMÅDE',fh,6)
m=['Kog bulguren efter anvisningen på pakken, og lad den','køle af. Steg kyllingen gyldig på en pande i 6-8','minutter, og skær den i strimler.','','DRESSING MED CITRON-TIMIAN','Pisk alle ingredienser sammen, og smag til.','','Vend bulgur med dressingen, og bland derefter','kylling, agurk, tomater, løg, feta og kikærter i.']
yy=1140
for t in m:
    if t.isupper():spaced(1260,yy,t,fh,6)
    else:d.text((1260,yy),t,font=F(RG,48),fill=(30,30,30))
    yy+=74
a=np.array(im)[:,:,::-1]
# photograph: perspective, shadow, warm light, a bit of blur and noise
OW,OH=3024,4032;bg=np.full((OH,OW,3),(55,60,70),np.uint8)
src=np.float32([[0,0],[W,0],[W,H],[0,H]]);dst=np.float32([[150,60],[OW-40,240],[OW+60,OH-420],[-60,OH-260]])
M=cv2.getPerspectiveTransform(src,dst);ph=cv2.warpPerspective(a,M,(OW,OH),borderValue=(55,60,70))
yy_,xx_=np.mgrid[0:OH,0:OW].astype(np.float32);light=np.clip(1.02-0.25*(yy_/OH)-0.12*(xx_/OW),0.6,1.05)
ph=ph.astype(np.float32)*light[:,:,None];ph[:,:,2]*=1.03;ph=cv2.GaussianBlur(ph,(0,0),1.2)+np.random.normal(0,4,ph.shape)
ph=np.clip(ph,0,255).astype(np.uint8)
cv2.imwrite('look_4032.jpg',ph,[cv2.IMWRITE_JPEG_QUALITY,85]);cv2.imwrite('look_2048.jpg',cv2.resize(ph,(1536,2048),interpolation=cv2.INTER_AREA),[cv2.IMWRITE_JPEG_QUALITY,85])
cv2.imwrite('prev.jpg',cv2.resize(ph,(600,800)))
print('ok')
