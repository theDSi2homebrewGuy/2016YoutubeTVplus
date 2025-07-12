# 2016YoutubeTVplus
an improved version of 2016youtubeTV by erievs (Erie Valley Software)


To use this, you must first install Node.js and NPM with node.js, and you also NEED to install Node, it is on macports if you are on macos, you also might need to install GIT if you aren't downloading directly from Github.

Now, unzip the node_modules.zip in the directory you have the other files in.

now that you have all thoughs downloaded and done, go to either terminal (Linux/MacOS) or CMD (Windows) and cd into the directory that you have the folder with all the files in it.

the command should be like this

cd /users/YOURNAME/Downloads/2016YoutubeTVplus-main/

then press enter (replace your name with your profiles name, if you are on mac, in terminal type cd then drag the folder to the command line and it should output the same result.

now do node 2016youtubetv_setup.js

enter your IP address you want to use (or do localhost.) if you are using 192.168.xxx.xxx and are going to post an issue, that IP tied to your local home network (only able to be seen by your router and other devices on that network.) and cannot be used to hack you unless the device used to hack you is also on that network. so do not censor it.

Finally, after setting it up emter npm start in the command line and to use it fo to the IP you put in and put :8090 after it, it should look like this, http://YOURIP:8090/ or http://localhost:8090/

---------------------------------------------------------------------------------------------------------------------

You may be wondering why I have done this, I did this as the original creator has abandonded this project completely (hasn't updated it since around February 12th 2025 and the project had misnamed some files causing them not to load in some web browsers, or not to load at all. I have changed some names and also updated some files to be newer

Is this a compleatly original experience like 2016?

No, it's pretty close but some things are missing (code wise but very unnoticable) and I have updated the default profile picture to the newer one from 2017. also you need to sign in for a recommended and the subscriptions section is broken. the Library section works but the trending section (in library) doesn't work as I think it is either a glitch or youtube has removed it. The autoplay feature is also broken and sadly doesn't work (I wish it did though.) also, to sign in you have to be really fast and do it multiple times. (I would recommend have Youtube.com/Activate on your phone or computer then press the sign in button in settings and rush to do it. I discovered this method as I did it as a joke and it actually worked.) But besides that, it works and feels like 2016 Youtube Leanback/TV, or Youtube for consoles!

Does this work on many devices?

Yes and No, you have to have a browser that can handle VERY heavy javascript, mainly Chrome, Edge, and Safari are the only one's I have tried it on for PC/Mac and it runs fine. I have also tried it on PS3, Xbox One, and Wii U, The Wii U and PS3 don't even load but xbox works fine. (mainly because it is Microsoft Edge) I also presume it would work on Xbox 360. for other consoles/web browsers I am not sure. This has been tested on a Mac mini 2012, a Mac mini (Late) 2009, and a 21.5inch 2017 iMac. I have tested chrome and safari on the Mac Mini's and safari on all three, both work fine.

Do I own this project?

No, I am only improving on 2016YoutubeTV that was made by erievs, which he revived the 2016 Youtube TV layout by Youtube INC and Google (at time Inc) now LLC.

If you are erievs or Google/Youtube and want me to take this down, please message me and I will delete this.

------------------------------------------------------------------------------------------------------------------

Progress Report ripped from erievs's 2016YoutubeTV github page.

Search - 100% Done

Status: Done. Next Steps: None.

Guide - 100% Done

Status: Done Next None;

Browse/Channels - 85% Done

Status: Working on finishing up the browse API, the homepage is close to being done but other parts may need work. Next Steps: Fully finish the implemtion.

4a. Watch - 90% Done

Status: Videos play, a tiny bit buggy somtimes **you need to play and pause and play again** for progress to work, but works.
Next Steps: Make it less bugger and chunk less data.

** Right now SOME videos don't work, this is just because I haven't done the WebM to H264 fallback yet, it will be fixed **
4b. Watch Interactions - 100% Done

Status: You can sub, unsub, like, and they'll all load.
Next Steps: Nothing.
Pairing - 30% Done

Status: Got some end points implemented, but they don't create the code. Next Steps: Get it to create the pairing code.

Sign In - 75% Done

Status: Implemented /o/oauth2/code and it properly grabs the oauth code or whatever it is calle, and Implemented /o/oauth2/token!! Next Steps: Make it so the token can request the token more than 5 times (rn you have to be fast).

Assets - 95% Done

Status: Most of the assets are there, with a few missing sound files and 404 errors that need to be addressed. Next Steps: Find the missing assets and add em.

Playlists - 20% Done

Status: The api seems to be there but just gotta figure how to format the browse api properly for the client to use em. Next Steps: Figure how to format the browse api properly for the client to use em.

Other
-̶ ̶G̶e̶t̶ ̶i̶t̶ ̶t̶o̶ ̶l̶o̶a̶d̶ ̶t̶h̶e̶ ̶b̶a̶c̶k̶g̶r̶o̶u̶n̶d̶ ̶o̶n̶ ̶h̶o̶m̶e̶s̶c̶r̶e̶e̶n̶.̶

̶-̶ ̶M̶a̶k̶e̶ ̶l̶i̶v̶e̶.̶j̶s̶ ̶w̶o̶r̶k̶ ̶b̶e̶t̶t̶e̶r̶ ̶(̶i̶t̶ ̶s̶o̶m̶e̶t̶i̶m̶e̶s̶ ̶c̶a̶u̶s̶e̶s̶ ̶i̶s̶s̶u̶e̶s̶ ̶w̶i̶t̶h̶ ̶t̶h̶e̶ ̶g̶u̶i̶d̶e̶,̶ ̶h̶o̶w̶e̶v̶e̶r̶ ̶i̶t̶ ̶i̶s̶n̶'̶t̶ ̶t̶h̶e̶ ̶g̶u̶i̶d̶e̶s̶ ̶f̶a̶u̶l̶t̶.̶)̶

-̶ ̶F̶i̶x̶ ̶o̶l̶d̶e̶r̶ ̶b̶r̶o̶w̶s̶e̶r̶ ̶s̶u̶p̶p̶o̶r̶t̶,̶ ̶r̶i̶g̶h̶t̶ ̶n̶o̶w̶ ̶w̶e̶ ̶u̶s̶e̶ ̶s̶o̶m̶e̶ ̶t̶h̶i̶n̶g̶ ̶f̶r̶o̶m̶ ̶E̶C̶M̶A̶S̶c̶r̶i̶p̶t̶ ̶6̶ ̶a̶n̶d̶ ̶7̶,̶ ̶l̶i̶k̶e̶ ̶l̶e̶t̶ ̶a̶n̶d̶ ̶f̶e̶t̶c̶h̶ ̶I̶ ̶a̶m̶ ̶w̶o̶r̶k̶i̶n̶g̶ ̶o̶n̶ ̶s̶u̶p̶p̶o̶r̶t̶i̶n̶g̶ ̶b̶r̶o̶w̶s̶e̶r̶ ̶t̶h̶e̶ ̶o̶f̶f̶i̶c̶a̶l̶ ̶c̶l̶i̶e̶n̶t̶ ̶w̶o̶u̶l̶d̶.̶

̶-̶ ̶M̶a̶k̶e̶ ̶i̶t̶ ̶s̶o̶ ̶y̶o̶u̶ ̶c̶a̶n̶ ̶u̶s̶e̶ ̶a̶n̶ ̶I̶P̶ ̶a̶d̶r̶e̶s̶s̶ ̶r̶a̶t̶h̶e̶r̶ ̶t̶h̶a̶n̶ ̶l̶o̶c̶a̶l̶h̶o̶s̶t̶:̶8̶0̶9̶0̶ ̶s̶o̶ ̶y̶o̶u̶ ̶c̶a̶n̶ ̶u̶s̶e̶ ̶i̶t̶ ̶o̶n̶ ̶a̶ ̶r̶e̶a̶l̶ ̶T̶V̶ ̶o̶r̶ ̶s̶o̶m̶e̶t̶h̶i̶n̶g̶.̶

Support other versions of YouTube TV

Other languages

Fix grammar
