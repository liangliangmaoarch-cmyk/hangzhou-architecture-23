from pathlib import Path
from urllib.request import urlopen
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

URL = 'https://liangliangmaoarch-cmyk.github.io/hangzhou-architecture-23/'
options = webdriver.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--window-size=1560,1000')
options.add_argument('--lang=zh-CN')
options.add_argument('--autoplay-policy=no-user-gesture-required')
proof = Path('preview-check')
proof.mkdir(exist_ok=True)

with webdriver.Chrome(options=options) as driver:
    wait = WebDriverWait(driver, 30)
    def element(css):
        return wait.until(lambda browser: browser.find_element(By.CSS_SELECTOR, css))
    def click(target):
        driver.execute_script('arguments[0].scrollIntoView({block:"center",behavior:"instant"})',target)
        wait.until(lambda browser: browser.execute_script("""
            const el=arguments[0], rect=el.getBoundingClientRect();
            const x=Math.min(innerWidth-1,Math.max(0,rect.x+rect.width/2));
            const y=Math.min(innerHeight-1,Math.max(0,rect.y+rect.height/2));
            return el.contains(document.elementFromPoint(x,y));
        """,target))
        target.click()
    def landed(fragment):
        wait.until(lambda browser: browser.current_url.endswith(fragment))
    def image_ready(css):
        wait.until(lambda browser: browser.execute_script(
            'const i=document.querySelector(arguments[0]);return i && i.complete && i.naturalWidth>0', css))
    def note(text):
        print(text, flush=True)
    with urlopen(URL+'app.js?release=9ca7d97',timeout=30) as response:
        assert response.read()==Path('app.js').read_bytes()
    driver.get(URL)
    wait.until(lambda browser: '230 张照片' in element('.roll-stats').text)
    note('Home rendered with 230 photos and 8 films')
    for project, code, size in [('LJM','P437',(2400,1082)),('WATER','P490',(2400,1350)),('STEEL','P352',(2400,1800))]:
        if project != 'LJM':
            click(element('.wordmark'))
            wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR,'.home-grid img')) == 3)
        link = element('.home-grid a[href="#/project/' + project + '"]')
        driver.execute_script('arguments[0].scrollIntoView({block:"center",behavior:"instant"})',link)
        image = link.find_element(By.TAG_NAME,'img')
        wait.until(lambda browser: image.get_property('complete') and image.get_property('naturalWidth')>0)
        assert '/t/' not in image.get_property('currentSrc')
        assert '1280w' in image.get_attribute('srcset') and '2400w' in image.get_attribute('srcset')
        if project=='LJM':
            driver.save_screenshot(str(proof/'home-covers.png'))
        click(link)
        landed('#/project/'+project)
        click(element('#reader-open'))
        wait.until(lambda browser: element('#viewer').get_property('open'))
        image_ready('#view-image')
        opened = element('#view-image')
        actual = tuple(opened.get_property(key) for key in ('naturalWidth','naturalHeight'))
        assert actual==size,(project,actual,size)
        assert opened.get_property('currentSrc').endswith('/media/'+code+'.webp')
        assert element('#view-note').text.strip()
        first = element('#view-title').text
        element('#view-close').send_keys(Keys.ARROW_RIGHT)
        wait.until(lambda browser: element('#view-title').text != first)
        click(element('#view-close'))
        note(project+' verified at '+str(actual))
    driver.get(URL+'#/project/GOA')
    wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR,'video'))==2)
    for video in driver.find_elements(By.CSS_SELECTOR,'video'):
        driver.execute_script('arguments[0].muted=true;arguments[0].play()',video)
        wait.until(lambda browser: video.get_property('videoWidth')>0 and video.get_property('currentTime')>.25)
        note('Played '+video.get_property('currentSrc')+'; duration '+str(round(video.get_property('duration'),2))+' seconds')
        driver.execute_script('arguments[0].pause()',video)
    driver.set_window_size(390,844)
    driver.get(URL)
    wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR,'.home-grid img'))==3)
    assert driver.execute_script('return document.documentElement.scrollWidth <= innerWidth')
    click(element('.home-grid a[href="#/project/WATER"]'))
    click(element('#reader-open'))
    image_ready('#view-image')
    assert element('#viewer').get_property('open')
    note('Mobile page and full-size album view passed')
