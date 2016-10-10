<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateEmailTable extends Migration {

	/**
     * Run the migrations.
     *
     * @return void
     */
	public function up()
	{
		Schema::create('emails', function(Blueprint $table)
		{
		    $table->increments('id');
		    $table->string('code');
		    $table->string('type');
            $table->string('subject');            
            $table->string('address');
            $table->string('sent_by')->nullable();
            $table->text('reference')->nullable();
            $table->integer('attempts')->default(0);
            $table->text('data')->nullable();
            $table->boolean('opened')->default(false);
            $table->boolean('sent')->default(false);
		    $table->timestamps();
		});
	}

	/**
     * Reverse the migrations.
     *
     * @return void
     */
	public function down()
	{
		Schema::drop('emails');
	}
}
