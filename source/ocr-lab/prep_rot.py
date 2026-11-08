import cv2,numpy as np,json,os,sys
gtf=sys.argv[1];out=sys.argv[2];extra_rot=int(sys.argv[3]) if len(sys.argv)>3 else 0
os.makedirs(out,exist_ok=True);gt=json.load(open(gtf))
def cur(im,L=3200):
    g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY).astype(np.float32);h,w=g.shape;lng=max(h,w);s=L/lng if lng>L else 1
    g=cv2.resize(g,(int(w*s),int(h*s)),interpolation=cv2.INTER_AREA);lo,hi=g.min(),g.max();return np.clip((g-lo)*255/max(hi-lo,20),0,255).astype(np.uint8)
R={90:cv2.ROTATE_90_CLOCKWISE,180:cv2.ROTATE_180,270:cv2.ROTATE_90_COUNTERCLOCKWISE}
for i,g in enumerate(gt):
    im=cv2.imread(g['file'])
    if extra_rot:im=cv2.rotate(im,R[extra_rot])     # simulate a photo taken sideways
    p=cur(im)
    for rot in (0,90,180,270):
        q=p if rot==0 else cv2.rotate(p,R[rot])
        cv2.imwrite(f'{out}/p{i}_r{rot}.png',q)
print('ok')
