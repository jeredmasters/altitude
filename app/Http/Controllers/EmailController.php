<?php namespace App\Http\Controllers;
    use Input, Session, Response;
class EmailController extends Controller {
    public function anyArray(){
        $prefill_folder = app_path() . '\prefill_scaffolds\\';
        $array = include($prefill_folder.'array.php');
        return Response::json($array, 200, array(), JSON_PRETTY_PRINT);
    }
    public function anyResponse(){
        $id = Input::get('i');
        
        $email = Email::resolveEmail($id, true);

        switch($email->type){
            case 'invite':
                try{
                    $invite = Invite::where('id','=',$email->reference)->first();
                    if (!$invite->spent){
                        Session::put('invite',json_encode($invite));

                        $invite->spent = true;
                        $invite->save();

                        return Angular::Redirect('/createuser');
                    }
                }
                catch(Exception $ex){
                    die($ex->getMessage());
                }
                break;
            case 'confirmation':
                User::where('key_base','=',$email->reference)->update('confirmed',true);
                break;
        }
        
        return $object;
    }
    public function anySubscription(){
        return View::make('premails.subscription', array('data' => $this->getObject()));
    }
}