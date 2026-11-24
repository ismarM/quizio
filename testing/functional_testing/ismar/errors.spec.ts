import {test,expect} from '@playwright/test';
import {checkEnvironment,login,createQuiz,publishQuiz,openQuiz} from './support';
import {writeFileSync} from 'node:fs';
test.beforeAll(checkEnvironment);
for(const mode of ['save','finish']) test(`ISM-FT-${mode==='save'?'03':'02'}: ${mode} HTTP 500`,async({page,browser})=>{
 await login(page,'user');
 const admin=await browser.newContext({baseURL:'http://localhost:3001'});
 try{
 const ap=await admin.newPage(); await login(ap,'admin');
 const quiz=await createQuiz(ap,`N6-${mode}`); await publishQuiz(ap,quiz.title,quiz.id); await openQuiz(page,quiz.title,quiz.id);
 await page.getByRole('link',{name:'Start quiz',exact:true}).click();
 await expect(page.getByRole('button',{name:'4',exact:true})).toBeVisible();
 const endpoint=`/api/proxy/quizzes/${quiz.id}/attempts${mode==='finish'?'/finish':''}`;
 await page.route(`**${endpoint}`,async route=>{
 if(route.request().method()===(mode==='save'?'PATCH':'POST')) await route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'internal_error',message:'Controlled N6 failure'})}); else await route.continue();
 });
 if(mode==='finish') await page.getByRole('button',{name:'Next',exact:true}).click();
 const response=page.waitForResponse(r=>new URL(r.url()).pathname===endpoint&&r.status()===500);
 await page.getByRole('button',{name:mode==='save'?'4':'Submit',exact:true}).click(); await response;
 await page.waitForTimeout(2000);
 const before=await page.request.get(`/api/proxy/quizzes/${quiz.id}/attempts`);const data=await before.json();
 const observed={mode,quizId:quiz.id,url:page.url(),browser:browser.version(),body:await page.locator('body').innerText(),attempt:data.attempt,responses:data.responses};
 await page.screenshot({path:`../../ZK_NALOGE/ZK_naloga6/ismar/dokazila/${mode}.png`,fullPage:true});
 if(mode==='save'){
 observed['selectedBeforeReload']=await page.getByRole('button',{name:'4',exact:true}).locator('svg.lucide-check').count();
 await page.reload(); observed['selectedAfterReload']=await page.getByRole('button',{name:'4',exact:true}).locator('svg.lucide-check').count();
 }
 writeFileSync(`../../ZK_NALOGE/ZK_naloga6/ismar/dokazila/${mode}.json`,JSON.stringify(observed,null,2));
 expect(data.attempt.time_taken_seconds == null).toBe(true);
 if(mode==='save'){expect(observed['selectedBeforeReload']).toBe(1);expect(data.responses).toHaveLength(0);} else expect(page.url()).toMatch(new RegExp(`/attempts/${quiz.id}$`));
 }finally{await admin.close()}
});
