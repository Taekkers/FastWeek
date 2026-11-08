import random,json,os,numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
from genlib import FONTS,RECIPES,photograph
os.makedirs('pagesC',exist_ok=True)
import re
def split(s):
    m=re.match(r'^([\d½¼¾/]+\s*(?:spsk\.|tsk\.|dl|g|l|dåse|fed|bundt|bdt\.|knivspids|skiver|stk\.)?)\s+(.*)$',s)
    return (m.group(1),m.group(2)) if m else ('',s)
gt=[]
for i in range(8):
    rec=RECIPES[i%6];title,pers,mins,ings=rec
    font=['serif','carlito','caladea','freesans'][i%4]
    layout='table' if i%2==0 else 'inline'
    W,H=1600,1300+len(ings)*95
    img=Image.new('RGB',(W,H),(248,245,236));d=ImageDraw.Draw(img)
    fb=ImageFont.truetype(FONTS[font],58);fh=ImageFont.truetype(FONTS[font],72)
    d.text((90,70),'INGREDIENSER' if i%3==0 else 'Ingredienser',font=fh,fill=(30,30,30))
    y=200
    for s in ings:
        q,n=split(s)
        if layout=='table':
            d.text((90,y),q,font=fb,fill=(30,30,30));d.text((560,y),n,font=fb,fill=(30,30,30))
        else:
            d.text((90,y),s,font=fb,fill=(30,30,30))
        y+=92
    img=img.crop((0,0,W,y+80))
    ph=photograph(img,random.Random(300+i),fill=0.92,rot=random.Random(i).uniform(-3,3),blur=1.3,noise=8,shadow=0.4,persp=0.05,out=(3024,4032))
    fn=f'pagesC/c{i}_{layout}_{font}.jpg';cv2.imwrite(fn,ph,[cv2.IMWRITE_JPEG_QUALITY,60])
    gt.append({'file':fn,'title':'','ings':ings,'font':font,'tag':layout})
json.dump(gt,open('pagesC/gt.json','w'),ensure_ascii=False,indent=1)
print('ok',len(gt))
