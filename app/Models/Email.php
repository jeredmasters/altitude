<?php


class Email extends BaseModel {
    protected $table = "emails";
    protected $json = array('data');

    public static function Send($data, $subject, $address, $type, $reference = null){

        $code = Uquery::generateRandomString(20);      
        
        

        $email = new Email;        
        $email->code = $code;
        $email->type = $type;
        $email->address = $address;
        $email->subject = $subject;
        $email->reference = $reference;
        $email->data = $data;

        $user = User::currentUser();
        if ($user != null){
            $email->sent_by = $user->key_base;
        }

        $email->save();
        static::processSpool($email);
        return $code;
    }
    public static function processSpool($emails_to_send = null){
        if (env("APP_ENV") != 'local'){
            if ($emails_to_send == null){
                $emails_to_send = Email::where('sent','=',false)->where('attempts','<',3)->get();
            }
            else{
                if (!is_array($emails_to_send)){
                    $emails_to_send = array($emails_to_send);
                }
            }
            foreach($emails_to_send as $email){
                Mail::send('emails.frame_email',['content' => static::renderEmail($email), 'url_view' => 'http://' . env('domain') . '/email/' . $email->code], function ($message) use ($email)
                {
                    $message->to($email->address)
                            ->subject($email->subject);
                });
                $email->attempts = 1;
                $email->sent = true;
                $email->save();
            }
        }
    }
    public static function renderEmail($email){
        if (is_integer($email)){
            $email = Email::find($email);
        }
        if (is_string($email)){ //this could be a code or id
            if (strlen($email) > 19){ //definitely a code
                $email = static::resolveEmail($email);
            }
            else{ // not a code
                $email = Email::find($email);
            }
        }

        $type = $email->type;
        $data = $email->data;

        $data['url_link'] =  'http://' . env('domain') . '/link/' . $email->code;
        
        return View::make('emails.partials.'.$type, $data)->render();
    }
    public static function resolveEmail($code, $mark = true){
		$email = Email::where('code','=',$code)->first();

		if ($email == null){
			throw new StopException('Could not find email');
		}

        if ($mark){
            $email->opened = true;
        }

		return $email;
	}
    public static function processEmail($id){
        $email = static::resolveEmail($id);
        switch($email->type){
            case 'invite':
                $invite = Invite::find($email->reference);
                Session::put('invite',json_encode($invite));
                return Angular::Redirect('/createuser');
                break;

            case 'welcome':
                Session::put('pushEmail',$email->address);
                return Angular::Redirect('/home');
                break;
        }
        return Angular::Redirect('/');
    }
}
