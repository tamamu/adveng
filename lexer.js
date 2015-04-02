

//アドベンチャーゲームエンジン 構文解析器
//Powered by Tamamu  2015.4.1

//構文ルール
/*
・変数名の頭文字はアルファベットもしくはアンダースコア_
・命令は[命令名 引数,引数…]の形、必要以上の空白は無視する
・引数の型は<数字> <文字列> <変数>のどれか
・命令以外の文字列は会話文となる
・シンボルフラグ*とジャンプフラグ@は文頭でのみ認識され、その行全体がフラグ名となる
*/

//出力
/*
Array< Hash<String, Array<Dynamic>> >
[{type:命令名, args:[引数1,引数2,…]},…]
*/


function lext(text){//ノベルスクリプト生データ全体を受け取る
	var num=/(-?(0?[.]\d+$|[1-9]+\d*(([.]\d+)|$)))|^0$/;//<数字>引数用正規表現
	var str=/^\".*\"$/;//<文字列>引数用正規表現
	var par=/^[_(a-z)(A-Z)]+[(0-9)(a-z)(A-Z)]*$/;//<変数>引数用正規表現
	
	var all=text.split(/\n/);//スクリプトを改行文字で区切ったもの
	var line;//スクリプトの各行を一時的に格納
	var out=[];//解析結果
	var aidx=0;//行番号
	var lidx=0;//文字番号
	var s='';//文字列一時格納用変数
	var arg=[];//引数群格納用変数
	var depth=0;//スコープ深さ
	var t='';//命令名格納用変数
	var sa=false;//現在処理中の引数が文字列型であるかどうか true=文字列型 false=その他
	
	function addarg(){
		if(sa){//String
			arg[arg.length]=s; //<文字列>引数追加
		}else{
			if(num.test(s)){//Number
				arg[arg.length]=Number(s);//<数字>引数追加
			}else if(par.test(s)){//Value
				arg[arg.length]={name: s};//<変数>引数追加
			}else{
				//変数名の頭文字がアルファベットかアンダースコアではない場合を予期している
				alert("error; line:"+aidx+" index:"+lidx+"\n無効な引数");//Error
			}
		}
	}

	for(;aidx<all.length;aidx++){
		line=all[aidx];
		if(line[0]=='*' || line[0]=='@'){//*シンボルフラグ or @ジャンプフラグ ※文頭に限る
			out[out.length]={type: line[0], args: [line.substring(1, line.length)]};//上記追加
		}else{
			for(lidx=0;lidx<line.length;lidx++){//行の先頭から1文字ずつ調べる
				//[命令名 引数1,引数2,…,引数n]
				switch(depth){
					case 0://<top level>
						if(line[lidx]=='\\'){//特殊文字記号発見
							s=s+line[lidx+1];
							lidx++;
						}else if(line[lidx]=='['){//命令ブロック発見
							if(s.length>0){//直前まで文字列が存在する場合
								out[out.length]={type: 'speak', args: [s]};//会話文に流す
								s='';
							}
							sa=false;//
							depth=1;//スコープを内側へ
						}else{//命令ブロックが存在しない
							s=s+line[lidx];//文字回収
						}
					break;
					case 1://[# ] <命令部>
						if(line[lidx]==' '){//空白発見
							if(s.length>0){//直前まで文字列が存在する場合
								t=s;//sを命令名としてtに格納
								s='';
								sa=false;
								depth=2;//スコープを内側へ
							}else{//直前まで空白のみ
								//取得した形 -> [　
								//スルー
							}
						}else if(line[lidx]==']'){//命令ブロック終端発見
							if(s.length>0){//直前まで文字列が存在する場合
								out[out.length]={type: s, args: []};//引数無し命令と認識
								s='';
								sa=false;
								depth=0;//スコープをトップレベルに戻す
							}else{
								depth=0;
								//取得した形 -> []
								alert("error; line:"+aidx+" index:"+lidx+"\n構文エラー")//エラーを発生させない場合はコメントアウト
							}
						}else{//文字回収
							s=s+line[lidx];
						}
					break;
					case 2://[ #] <引数部>
						switch(line[lidx]){
							case ']'://命令ブロック終端発見
								addarg();//直前の引数追加
								out[out.length]={type: t, args: arg};// t という命令と arg という引数群を認識
								depth=0;//スコープをトップレベルに戻す
								t='';
								s='';
								sa=false;
								arg=[];
							break;
							case '\"'://文字列型引数ブロック発見
								s='';
								sa=true;//引数が文字列型であると認識
								depth=3;//スコープを内側へ
							break;
							case ','://引数区切り文字発見
								addarg();//直前の引数追加
								s='';
								sa=false;
							break;
							case ' '://空白発見
								//スルー
							break;
							default://文字回収
								s=s+line[lidx];
							break;
						}
					break;
					case 3://[ "#"] <文字列型引数>
						if(line[lidx]=='\"'){//文字列型引数ブロック終端発見
							depth=2;//スコープを外側へ
						}else{
							s=s+line[lidx];//文字回収
						}
					break;
				}
			}
			if(s.length>0)out[out.length]={type: 'speak', args: [s]};//残りの処理されなかった文字列は会話文に流す
		}
	}
	//console.log(out);
	return out;
}
