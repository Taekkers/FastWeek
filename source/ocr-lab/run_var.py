import cv2,numpy as np,subprocess,os,sys,json
from concurrent.futures import ThreadPoolExecutor
lang=os.environ.get('LANG_','eng');GTF=os.environ.get('GT','pagesH/gt.json');gt=json.load(open(GTF))
def gray(im):return cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
def flatten(g,k=None):
    h,w=g.shape
    k=k or max(15,(max(h,w)//40)|1)
    bg=cv2.GaussianBlur(cv2.resize(g,(w//8,h//8),interpolation=cv2.INTER_AREA).astype(np.float32),(0,0),k/8)
    bg=cv2.resize(bg,(w,h),interpolation=cv2.INTER_LINEAR)
    f=g.astype(np.float32)/np.maximum(bg,1)*235
    return np.clip(f,0,255)
def stretch(f,lo_p=1,hi_p=99):
    lo,hi=np.percentile(f,[lo_p,hi_p]);return np.clip((f-lo)*255/max(hi-lo,20),0,255).astype(np.uint8)
def sauvola(g,win=None,k=0.2):
    h,w=g.shape;win=win or (max(25,(w//40)|1))
    gi=g.astype(np.float64);i1=cv2.integral(gi);i2=cv2.integral(gi*gi)
    r=win//2
    y0=np.clip(np.arange(h)-r,0,h);y1=np.clip(np.arange(h)+r+1,0,h)
    x0=np.clip(np.arange(w)-r,0,w);x1=np.clip(np.arange(w)+r+1,0,w)
    def box(I):
        return I[np.ix_(y1,x1)]-I[np.ix_(y0,x1)]-I[np.ix_(y1,x0)]+I[np.ix_(y0,x0)]
    n=(y1-y0)[:,None]*(x1-x0)[None,:]
    m=box(i1)/n;sd=np.sqrt(np.maximum(box(i2)/n-m*m,0))
    t=m*(1+k*(sd/128-1))
    return np.where(gi>t,255,0).astype(np.uint8)
def resize_long(g,L):
    h,w=g.shape;s=L/max(h,w)
    return cv2.resize(g,(int(w*s),int(h*s)),interpolation=cv2.INTER_AREA if s<1 else cv2.INTER_CUBIC)
def ocr(img,psm,tag):
    fn=f'/tmp/claude-0/ocrlab/tmp_{tag}.png';cv2.imwrite(fn,img)
    r=subprocess.run(['tesseract',fn,'-','-l',lang,'--psm',str(psm)],capture_output=True,text=True)
    return r.stdout
def run(name,fn,psms=(3,)):
    out=f'var_{name}';os.makedirs(out,exist_ok=True)
    def one(i):
        im=cv2.imread(gt[i]['file']);p=fn(im);t=''
        t='\n@@PASS@@\n'.join(ocr(p,ps,f'{name}_{i}_{ps}') for ps in psms)
        open(f'{out}/p{i}.txt','w').write(t)
    with ThreadPoolExecutor(max_workers=int(os.environ.get('W','4'))) as ex:list(ex.map(one,range(len(gt))))
    print('done',out)
if __name__=='__main__':
    name=sys.argv[1]
    def cur(im,L=2400):
        g=gray(im).astype(np.float32);h,w=g.shape;lng=max(h,w);s=L/lng if lng>L else 1
        g=cv2.resize(g,(int(w*s),int(h*s)),interpolation=cv2.INTER_AREA)
        lo,hi=g.min(),g.max();return np.clip((g-lo)*255/max(hi-lo,20),0,255).astype(np.uint8)
    V={'flatS32':lambda im:stretch(flatten(resize_long(gray(im),3200),k=401)),
     'flatS36':lambda im:stretch(flatten(resize_long(gray(im),3600),k=451)),
     'cur36':lambda im:cur(im,3600),
     'cur':cur,'cur3200':lambda im:cur(im,3200),'curp':lambda im:stretch(resize_long(gray(im),2400).astype(np.float32)),
     'flatS':lambda im:stretch(flatten(resize_long(gray(im),2400),k=301)),
     'flat2400':lambda im:stretch(flatten(resize_long(gray(im),2400))),
     'flat3200':lambda im:stretch(flatten(resize_long(gray(im),3200))),
     'flat4000':lambda im:stretch(flatten(resize_long(gray(im),4000))),
     'flat4800':lambda im:stretch(flatten(resize_long(gray(im),4800))),
     'plain3200':lambda im:stretch(resize_long(gray(im),3200).astype(np.float32)),
     'sauv3200':lambda im:sauvola(stretch(flatten(resize_long(gray(im),3200)))),
    }
    run(name,V[name],tuple(int(x) for x in os.environ.get('PSMS','3').split(',')))
